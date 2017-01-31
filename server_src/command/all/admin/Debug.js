// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import {Redis} from '../../../utils/DBManager';
import MusicManager from '../../../music/MusicManager';

class DebugCommand extends AbstractCommand {

    constructor() {
        super("debug", [
            PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "", "Debugging tools for administrators", ["dbg"]);
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
                case "setvotes":
                    //setvotes up/down
                    if (!MusicManager) {
                        throw "";
                    }
                    const upvotes = parseInt(args[1]);
                    const downvotes = parseInt(args[2]);

                    const surrogateMembers = _.shuffle(msg.guild.members.array());

                    if ((upvotes + downvotes) > surrogateMembers.length) {
                        return;
                    }

                    MusicManager.votes = new Map();
                    for (let i = 0; i < upvotes; i++) {
                        MusicManager.votes.set(surrogateMembers[i].id, true);
                    };
                    for (let i = 0; i < downvotes; i++) {
                        MusicManager.votes.set(surrogateMembers[upvotes + i].id, false);
                    };
                    await MusicManager.processVoteEffects("VOTE");
                    await MusicManager.updateNowPlaying();
                    this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Setting votes to " + upvotes + ":thumbsup: " + downvotes + ":thumbsdown:.", 5000, msg);
                    break;
                default:
                    throw "";
            }
        } catch (e) {
            msg.delete();
        }
    };

}

export default new DebugCommand();
