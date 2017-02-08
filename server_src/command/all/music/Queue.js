// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';
import Config from '../../../../config';

class QueueCommand extends AbstractCommand {

    constructor() {
        super("queue", [
            PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], "<youtubeURL|searchQuery>", "Add a track to the queue", ["play"]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        if (args.length < 1) {
            this.tools.volatileReply(reply, "Please specify a youtube url or search query to play!", 5000, msg);
            return;
        }

        if (msg.channel.id != Config.MUSIC_CONTROL_CHANNEL) {
            msg.delete().catch(e => {});
            return;
        }

        const query = args.join(" ");
        try {
            const playData = await MusicManager.play(query, user);
            reply("Added **" + playData.queueItem.videoInfo.title + "** to the queue. Position in queue: **" + playData.queuePosition + "** - estimated time until play: `" + playData.eta + "`");
        } catch (e) {
            switch (e.e) {
                case "QUEUE_FULL":
                    this.tools.volatileReply(reply, "The queue is full, please wait to add more music!", 5000, msg);
                    break;
                case "NO_RESULTS_FOUND":
                    this.tools.volatileReply(reply, "There are no results for '" + query + "'!", 5000, msg);
                    break;
                case "SEARCH_ERROR":
                    this.tools.volatileReply(reply, "An error has occurred while searching. Please notify a staff member!", 5000, msg);
                    break;
                case "DUPLICATE_ENTRY":
                    this.tools.volatileReply(reply, "This song is already in the queue! Please wait for it to play before queuing it again.", 5000, msg);
                    break;
                case "SEARCH_RESOLVE_ERROR":
                    this.tools.volatileReply(reply, "An error has occurred while resolving your search. Please notify a staff member!", 5000, msg);
                    break;
                case "MAX_ALLOWED_QUEUES":
                    this.tools.volatileReply(reply, "You have reached your maximum of **" + e.allowed + "** queued song" + (e.allowed > 1
                        ? "s"
                        : "") + "! Please wait for " + (e.allowed > 1
                        ? "some of them"
                        : "it") + " to play before queuing more.", 5000, msg);
                    break;
                case "USER_QUEUE_COOLDOWN":
                    this.tools.volatileReply(reply, "Please wait! You can queue again in `" + e.timeRemaining + "`.", 5000, msg);
                    break;
                case "BLACKLISTED_TEMPORARILY":
                    this.tools.volatileReply(reply, "This song is temporarily blacklisted. It cannot be played at this moment.", 5000, msg);
                    break;
                case "BLACKLISTED_PERMANENTLY":
                    this.tools.volatileReply(reply, "This song is permanently blacklisted. It cannot be played.", 5000, msg);
                    break;
                case "FILTERED_TITLE":
                    this.tools.volatileReply(reply, "This song's title contains something that has been blacklisted. It cannot be played.", 5000, msg);
                    break;
                case "CONTENT_TOO_LONG":
                    this.tools.volatileReply(reply, "This song exceeds our 10 minute limit. It cannot be played.", 5000, msg);
                    break;
                case "SEARCH_DISABLED":
                    this.tools.volatileReply(reply, "Please enter a youtube URL. Search is currently not enabled by the guild administrators.", 5000, msg);
                    break;
                case "NOT_LISTENING":
                    this.tools.volatileReply(reply, "You're not allowed to queue songs if you're not listening.", 2000, msg);
                    break;
                default:
                    console.log("UNEXPECTED !PLAY RESPONSE", e);
                    this.tools.volatileReply(reply, "An unknown error has occurred. Please notify a staff member!", 5000, msg);
                    break;
            }
        }
        msg.delete().catch(e => {});
    };

}

export default new QueueCommand();
