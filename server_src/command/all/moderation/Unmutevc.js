// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import Logging from '../../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';
import DiscordUtils from '../../../utils/DiscordUtils';
import UserUtils from '../../../utils/UserUtils';
import VCMuteController from '../../../utils/VCMuteController';

class UnmuteVCCommand extends AbstractCommand {

    constructor() {
        super("unmutevc", [
            PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.MODERATOR, PERMISSION_PRESETS.MAGICANDCHILL.MODS
        ], "[channelId]", "Lift a mute on a voice channel");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {

        const voiceChannel = user.voiceChannel || (args.length > 0 ? user.guild.channels.array().find(channel => channel.type == "voice" && channel.id == args[0]) : null);

        if (!voiceChannel) {
          this.tools.volatileReply(reply, "Either join the channel you'd like to unmute, or specify a valid channel ID!", 5000, msg);
          return;
        }

        if (!VCMuteController.isVCMuted(voiceChannel)) {
          this.tools.volatileReply(reply, "Voice channel **'" + voiceChannel.name + "'** is not muted! Use `!mutevc` to mute it.", 5000, msg);
          return;
        }

        VCMuteController.setVCMuted(voiceChannel, user, false);
        Logging.mod(Logging.format("VC MUTE LIFT", "**" + user.user.username + "** has disabled the VC mute for channel **'" + voiceChannel.name + "'**",false));
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " The mute on **'" + voiceChannel.name + "'** has been lifted!", 5000, msg);
    };

}

export default new UnmuteVCCommand();
