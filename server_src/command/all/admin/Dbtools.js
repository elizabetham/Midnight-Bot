// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import {Redis} from '../../../utils/DBManager';

class DbtoolsCommand extends AbstractCommand {

    constructor() {
        super("dbtools", [
            PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], ["db"]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        try {
            switch (args[0]) {
                case "redis":
                    switch (args[1]) {
                        case "clean":
                        case "flush":
                        case "flushall":
                            this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Fully flushing Redis DB...", 5000, msg);
                            await Redis.flushallAsync();
                            this.tools.volatileReply(reply, "Redis DB flushed.", 5000, msg);
                            break;
                        default:
                            throw "";
                    }
                    break;
                default:
                    throw "";
            }
        } catch (e) {
            msg.delete();
        }
    };

}

export default new DbtoolsCommand();
