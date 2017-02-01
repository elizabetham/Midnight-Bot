// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import {Redis} from '../../../utils/DBManager';
import MusicManager from '../../../music/MusicManager';
import {exec} from 'child_process';

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
                    // case "shell":
                    //     //Delete request message
                    //     msg.delete();
                    //
                    //     //Clean output
                    //     const clean = (text : any) => {
                    //         return (typeof text !== "string")
                    //             ? text
                    //             : text.replace("``", `\`${String.fromCharCode(8203)}\``);
                    //     };
                    //
                    //     //Obtain command
                    //     const cmd = args.slice(1, args.length).join(" ");
                    //
                    //     //Construct & send progress message
                    //     let rep = ["`RUNNING`", "```xl", clean(cmd), "```"];
                    //     const repmsg = await msg.channel.sendMessage(rep);
                    //
                    //     //Execute command
                    //     let stdOut = await new Promise((resolve, reject) => {
                    //         exec(cmd, {}, (err, stdout, stderr) => {
                    //             if (err)
                    //                 return reject({stdout, stderr});
                    //             resolve(stdout);
                    //         });
                    //     }).catch(data => {
                    //         //Construct error data
                    //         data.stderr = data.stderr
                    //             ? [
                    //                 "`STDERR`",
                    //                 "```sh",
                    //                 clean(data.stderr.substring(0, 800)) || " ",
                    //                 "```"
                    //             ]
                    //             : [];
                    //         data.stdout = data.stdout
                    //             ? [
                    //                 "`STDOUT`",
                    //                 "```sh",
                    //                 clean(data.stdout.substring(0, data.stderr
                    //                     ? data.stderr.length
                    //                     : 2046 - 40)) || " ",
                    //                 "```"
                    //             ]
                    //             : [];
                    //
                    //         //Show error data
                    //         let message = data.stdout.concat(data.stderr).join("\n").substring(0, 2000);
                    //         repmsg.edit(message);
                    //         //Delete the message after 15 seconds
                    //         repmsg.delete(15000);
                    //     });
                    //     //Show output
                    //     await repmsg.edit([
                    //         "`OUTPUT`",
                    //         "```sh",
                    //         clean(stdOut.substring(0, 1750)),
                    //         "```"
                    //     ].join("\n"));
                    //     //Delete the message after 15 seconds
                    //     repmsg.delete(15000);
                    //     break;
                default:
                    throw "";
            }
        } catch (e) {
            msg.delete();
        }
    };

}

export default new DebugCommand();
