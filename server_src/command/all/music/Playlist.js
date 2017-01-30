// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import {UserRecord} from '../../../utils/DBManager';
import UserUtils from '../../../utils/UserUtils';
import MusicManager from '../../../music/MusicManager';
import DiscordUtils from '../../../utils/DiscordUtils';

class PlaylistCommand extends AbstractCommand {

    playlistMessage :
        ? Message;

    constructor() {
        super("playlist", [PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        await msg.delete();

        //Moderator sub-command for purging the entire queue
        if (args.length > 0 && args[0] == 'purge') {
            if (!DiscordUtils.hasPermission(user, PERMISSION_PRESETS.CONVICTS.MODERATOR.getRole()) && !DiscordUtils.hasPermission(user, PERMISSION_PRESETS.BOTDEV.MODERATOR.getRole())) {
                this.tools.volatileReply(reply, _.sample(Lang.NO_PERMISSION), 5000, msg);
                return;
            }
            MusicManager.queue.queue.splice(0, MusicManager.queue.queue.length);
            this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Queue purged.", 5000, msg);
            return;
        }

        try {
            //Obtain current status
            const status = MusicManager.getStatus();

            //Construct new response
            let response = (status.currentItem)
                ? (status.queue
                    ? "\n"
                    : "") + "Current Song: **" + status.currentItem.videoInfo.title + "** added by **" + (status.currentItem.requestedBy
                    ? (await UserUtils.assertUserRecord(status.currentItem.requestedBy)).username
                    : "Midnight") + "** `[" + MusicManager.secondsToTimestamp(status.currentProgress) + "/" + MusicManager.secondsToTimestamp(Number(status.currentItem.videoInfo.length_seconds)) + "]`"
                : "No song is currently playing.";

            if (status.queue) {
                response += "\n\n";
                (await Promise.all(status.queue.map(async(item, index) => "`" + (index + 1) + ".` **" + item.videoInfo.title + "** added by **" + (item.requestedBy
                    ? (await UserUtils.assertUserRecord(item.requestedBy)).username
                    : "Midnight") + "**\n"))).forEach(line => response += line);
            }

            //Delete old playlist message
            if (this.playlistMessage) {
                this.playlistMessage.delete();
            }

            //Send new playlist message
            this.playlistMessage = await msg.channel.sendMessage(response);
        } catch (e) {
            console.log(e);
        }
    };

}

export default new PlaylistCommand();
