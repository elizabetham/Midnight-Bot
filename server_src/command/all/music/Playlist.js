// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import {UserRecord} from '../../../utils/DBManager';
import UserUtils from '../../../utils/UserUtils';
import MusicManager from '../../../music/MusicManager';

class PlaylistCommand extends AbstractCommand {

    constructor() {
        super("playlist", [PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        try {
            const status = MusicManager.getStatus();

            let response = (status.currentItem)
                ? "\nCurrent Song: **" + status.currentItem.videoInfo.title + "** added by **" + (status.currentItem.requestedBy
                    ? (await UserUtils.assertUserRecord(status.currentItem.requestedBy)).username
                    : "Midnight") + "** `[" + MusicManager.secondsToTimestamp(status.currentProgress) + "/" + MusicManager.secondsToTimestamp(Number(status.currentItem.videoInfo.length_seconds)) + "]`"
                : "No song is currently playing.";

            if (status.queue) {
                response += "\n\n";
                (await Promise.all(status.queue.map(async(item, index) => "`" + (index + 1) + ".` **" + item.videoInfo.title + "** added by **" + (item.requestedBy
                    ? (await UserUtils.assertUserRecord(item.requestedBy)).username
                    : "Midnight") + "**\n"))).forEach(line => response += line);
            }

            reply(response);
        } catch (e) {
            console.log(e);
        }
    };

}

export default new PlaylistCommand();
