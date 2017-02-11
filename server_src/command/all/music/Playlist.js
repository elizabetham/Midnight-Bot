// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';
import Config from '../../../../config';
import UserUtils from '../../../utils/UserUtils';

class PlaylistCommand extends AbstractCommand {

    constructor() {
        super("playlist", [
            PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], "", "View the current music queue", ["pl"]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        if (msg.channel.id != Config.MUSIC_CONTROL_CHANNEL) {
            return;
        }

        let newMessage = "";

        if (MusicManager.activeItem) {
            newMessage += "\n`Now` **" + MusicManager.activeItem.videoInfo.title + "** added by **" + (MusicManager.activeItem.requestedBy
                ? (await UserUtils.assertUserRecord(MusicManager.activeItem.requestedBy)).username
                : "Midnight") + "**\n";
        }

        //Playlist
        if (MusicManager.queue.getQueue().length > 0) {
            (await Promise.all(MusicManager.queue.getQueue().map(async(item, index) => "`" + (index + 1) + ".` **" + item.videoInfo.title + "** added by **" + (item.requestedBy
                ? (await UserUtils.assertUserRecord(item.requestedBy)).username
                : "Midnight") + "**\n"))).forEach(line => newMessage += line);
        } else if (newMessage == "") {
            newMessage = "There's nothing playing or queued!";
        }

        this.tools.volatileReply(reply, newMessage, 5000, msg);

    };

}

export default new PlaylistCommand();
