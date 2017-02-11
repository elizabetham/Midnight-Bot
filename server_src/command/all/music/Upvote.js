// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';
import Config from '../../../../config';

class UpvoteCommand extends AbstractCommand {

    constructor() {
        super("upvote", [
            PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], "", "Upvote the currently playing track", ["up"]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        if (msg.channel.id != Config.MUSIC_CONTROL_CHANNEL) {
            return;
        }

        await msg.delete().catch(e => {});

        try {
            await MusicManager.upvote(user);
            this.tools.volatileReply(reply, "upvoted!", 1000);
        } catch (e) {
            switch (e.e) {
                case "ALREADY_VOTED":
                    this.tools.volatileReply(reply, "You have already voted for this track!", 2000, msg);
                    break;
                case "NOT_LISTENING":
                    this.tools.volatileReply(reply, "You're not allowed to vote if you're not a listener.", 2000, msg);
                    break;
                case "NO_ACTIVE_SONG":
                    this.tools.volatileReply(reply, "There is no song currently playing to vote for.", 5000, msg);
                    break;
                case "SELF_VOTE":
                    this.tools.volatileReply(reply, "You cannot vote for yourself m8", 5000, msg);
                    break;
                case "NO_VOTING_YET":
                    this.tools.volatileReply(reply, "Please let this song play for **" + e.wait + "** more seconds before voting!", 5000, msg);
                    break;
                default:
                    console.log("UNKNOWN UPVOTE RESPONSE", e);
                    this.tools.volatileReply(reply, "An unknown error has occurred. Please notify a staff member!", 5000, msg);
                    break;
            }
        }
    };

}

export default new UpvoteCommand();
