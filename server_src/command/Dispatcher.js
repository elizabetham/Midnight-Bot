// @flow
import type {Message}
from 'discord.js';

import AbstractCommand from './AbstractCommand';

//Admin
import GameCommand from './all/admin/Game';
import RestartCommand from './all/admin/Restart';
import Dbtools from './all/admin/Dbtools';

//Moderation
import BanCommand from './all/moderation/Ban';
import MuteCommand from './all/moderation/Mute';
import UnmuteCommand from './all/moderation/Unmute';
import UnbanCommand from './all/moderation/Unban';

//Music
import QueueCommand from './all/music/Queue';
import SkipCommand from './all/music/Skip';
import UpvoteCommand from './all/music/Upvote';
import DownvoteCommand from './all/music/Downvote';
import BlacklistCommand from './all/music/Blacklist';
import DequeueCommand from './all/music/Dequeue';

//Misc
import HelpCommand from './all/misc/Help';

const commands = [
    HelpCommand,
    QueueCommand,
    DequeueCommand,
    DownvoteCommand,
    UpvoteCommand,
    BlacklistCommand,
    SkipCommand,
    BanCommand,
    UnbanCommand,
    MuteCommand,
    UnmuteCommand,
    RestartCommand,
    GameCommand,
    Dbtools
];

export const processMessage = (message : Message) : boolean => {
    //Strip off mention & obtain split data
    const args = message.content.replace(new RegExp("(^<@[0-9]*> )|(^\!)", "gi"), "").split(/\s+/gi);

    //If no command was supplied quit here
    if (args.length == 0)
        return false;

    //Extract command name and remove it from args
    const cmd = args.shift();

    //Attempt finding a relevant command class
    const cmdObj :
        ? AbstractCommand = commands.find(c => c.command.toLowerCase() == cmd.toLowerCase() || c.aliases.indexOf(cmd.toLowerCase()) > -1);

    //If none found, stop here
    if (!cmdObj)
        return false;

    //Call the found command
    cmdObj.call(message, args);

    //Stop chat filter processing
    return true;
};

commands.forEach(cmd => {
    console.log("<Row>\n" +
        "    <hr/>\n" +
        "    <h3 style={style.commandHeader}>!" + cmd.command + "</h3>\n" + "    <h5 style={style.commandHeader}>\n" + "        &nbsp;- " + cmd.description + "</h5>\n" + "    <h5>Usage:" + "        <code>" + cmd.getUsage(false) + "</code>\n" + "    </h5>\n" + "    <p>Minimum role required:&nbsp;<code>ROLE HERE</code>\n" + "    </p>\n" + "</Row>\n");
});

export {commands};

export default {
    processMessage,
    commands
};
