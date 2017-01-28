// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../Lang';
import _ from 'lodash';
import MusicManager from '../../utils/MusicManager';

class PlayCommand extends AbstractCommand {

    constructor() {
        super("play", [PERMISSION_PRESETS.CONVICTS.PLATINUM_PEEPS, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
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

        const query = args.join(" ");
        try {
            const playData = await MusicManager.play(query, user.user.id);
            reply("Added **" + playData.queueItem.videoInfo.title + "** to the queue. Position in queue: **" + playData.queuePosition + "** - estimated time until play: " + playData.eta);
        } catch (e) {
            switch (e) {
                case "QUEUE_FULL":
                    this.tools.volatileReply(reply, "The queue is full, please wait to add more music!", 5000, msg);
                    break;
                case "NO_RESULTS_FOUND":
                    this.tools.volatileReply(reply, "There are no results for '" + query + "'!", 5000, msg);
                    break;
                case "SEARCH_ERROR":
                    console.log(e);
                    this.tools.volatileReply(reply, "An error has occurred when searching. Please notify a staff member!", 5000, msg);
                    break;
                case "DUPLICATE_ENTRY":
                    this.tools.volatileReply(reply, "This song is already in the queue! Please wait for it to play before queuing it again.", 5000, msg);
                    break;
                default:
                    console.log(e);
                    this.tools.volatileReply(reply, "An unknown error has occurred. Please notify a staff member!", 5000, msg);
                    break;
            }
        }
    };

}

export default new PlayCommand();