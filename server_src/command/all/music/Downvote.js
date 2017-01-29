// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';

class DownvoteCommand extends AbstractCommand {

    constructor() {
        super("downvote", [PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        try {
            await MusicManager.downvote(user);
            this.tools.volatileReply(reply, "downvoted!", 1000, msg);
        } catch (e) {
            switch (e) {
                default:
                    console.log("UNKNOWN DOWNVOTE RESPONSE", e);
                    this.tools.volatileReply(reply, "An unknown error has occurred. Please notify a staff member!", 5000, msg);
                    break;
            }
        }
    };

}

export default new DownvoteCommand();
