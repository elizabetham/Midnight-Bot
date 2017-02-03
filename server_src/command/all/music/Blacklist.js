// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';
import {yt} from '../../../music/MusicTools';

class BlacklistCommand extends AbstractCommand {

    constructor() {
        super("blacklist", [
            PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "<add/remove> <youtubeURL>", "Add or remove a track from the permanent blacklist");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        if (args.length < 2) {
            this.tools.volatileReply(reply, this.getUsage(), 5000, msg);
            return;
        }

        let info;
        try {
            info = await yt.getInfo(args[1]);
        } catch (e) {
            this.tools.volatileReply(reply, "Invalid URL. Please enter a valid youtube video URL!", 5000, msg);
            return;
        }

        try {
            switch (args[0]) {
                case "add":
                    await MusicManager.blacklistVideo(info.video_id, user.id);
                    break;
                case "remove":
                    await MusicManager.unblacklistVideo(info.video_id);
                    break;
                default:
                    this.tools.volatileReply(reply, this.getUsage(), 5000, msg);
                    return;
            }
            this.tools.volatileReply(reply, "Successfully blacklisted **'" + info.title + "'**.", 5000, msg);
        } catch (e) {
            switch (e.e) {
                case "ALREADY_BLACKLISTED":
                    this.tools.volatileReply(reply, "This track is already blacklisted!", 2000, msg);
                    break;
                case "ALREADY_ALLOWED":
                    this.tools.volatileReply(reply, "This track is not on the blacklist!", 2000, msg);
                    break;
                default:
                    console.log("UNKNOWN DOWNVOTE RESPONSE", e);
                    this.tools.volatileReply(reply, "An unknown error has occurred. Please notify a staff member!", 5000, msg);
                    break;
            }
        }
    };

}

export default new BlacklistCommand();
