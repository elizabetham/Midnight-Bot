// @flow
import moment from 'moment';
import {Redis} from './DBManager';
import {VoiceChannel, GuildMember, Guild} from 'discord.js';
import DiscordUtils from './DiscordUtils';
import {PERMISSION_PRESETS} from './Permission';

class MuteEntry {
    channelId : string;
    mutedBy : string;
    mutedAt : number;

    constructor(channelId : string, mutedBy : string) {
        this.channelId = channelId;
        this.mutedBy = mutedBy;
        this.mutedAt = moment().unix();
    }
}

class VCMuteController {

    muteCache : Array < MuteEntry >;
    mutedUsers : Array < {
        uid: string,
        guildid: string
    } >;

    constructor() {
        //Construct this object
        this.muteCache = [];
        this.mutedUsers = [];
        this.saveCache = this.saveCache.bind(this);
        this.isVCMuted = this.isVCMuted.bind(this);
        this.setVCMuted = this.setVCMuted.bind(this);
        this.initialLoad = this.initialLoad.bind(this);
        this.setUserMute = this.setUserMute.bind(this);

        //Unmute users that remained muted during a reboot
        this.initialLoad();

        //Track joining & leaving users
        DiscordUtils.client.on('voiceStateUpdate',async(oldMember, newMember) => {
          const oldVC = oldMember.voiceChannel;
          const newVC = newMember.voiceChannel;

          if (oldVC && newVC) {
             //CHANNEL MOVE (Evaluate remute)
             const oldMute = this.muteCache.find(e => e.channelId == oldVC.id);
             const newMute = this.muteCache.find(e => e.channelId == newVC.id);
             if (!oldMute && newMute) {
               this.setUserMute(newMember,true);
             } else if (oldMute && !newMute) {
               this.setUserMute(newMember,false);
             }
          }
          else if (oldVC) {
            //DISCONNECT (Unmute disconnecting users)
            this.setUserMute(newMember,false);
          }
          else if (newVC) {
            //CONNECT (Mute newly joining users)
            if (this.muteCache.find(e => e.channelId == newVC.id)) {
              this.setUserMute(newMember,true);
            }
          }
        });
    }

    initialLoad : Function;
    async initialLoad() {
        const cacheStr = await Redis.getAsync("VCMuteCache");
        if (!cacheStr)
            return;
        try {
            const oldMuteCache = JSON.parse(cacheStr);
            if (oldMuteCache && oldMuteCache.constructor === Array) {
                oldMuteCache.forEach(async(m) => {
                    let guild = DiscordUtils.client.guilds.get(m.guildid);
                    let member = guild
                        ? await guild.fetchMember(m.uid)
                        : null;
                    if (member) {
                        this.setUserMute(member, false);
                    }
                });
            }
        } catch (e) {}
        await Redis.del("VCMuteCache");
    }

    saveCache : Function;
    saveCache() {
        Redis.set("VCMuteCache", JSON.stringify(this.mutedUsers));
    }

    isVCMuted : (VoiceChannel) => boolean;
    isVCMuted(channel : VoiceChannel) {
        return this.muteCache.find(item => item.channelId == channel.id);
    }

    setVCMuted : (VoiceChannel, string, boolean) => void;
    setVCMuted(channel : VoiceChannel, mutedBy : string, mute : boolean = true) {
        this.muteCache = this.muteCache.filter(item => item.channelId != channel.id)
        if (mute) {
            const muteEntry = new MuteEntry(channel.id, mutedBy);
            this.muteCache = this.muteCache.concat(muteEntry);
        }
        channel.members.array().filter(member => ![PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.MODERATOR].find(perm => DiscordUtils.hasPermission(member, perm.getRole()))).forEach(member => this.setUserMute(member, mute));
    }

    setUserMute : (GuildMember, boolean) => void;
    setUserMute(member : GuildMember, mute : boolean = true) {
        if (mute && !this.mutedUsers.find(id => id.uid == member.id)) {
            this.mutedUsers.push({uid: member.id, guildid: member.guild.id});
        } else if (!mute && this.mutedUsers.find(id => id.uid == member.id)) {
            this.mutedUsers = this.mutedUsers.filter(id => id.uid != member.id);
        }
        member.setMute(mute);
        this.saveCache();
    }

}

export default new VCMuteController();
