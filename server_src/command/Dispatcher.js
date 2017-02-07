// @flow
import type {Message}
from 'discord.js';

import CommandTools from './CommandTools';
import Logging from '../utils/Logging';

import AbstractCommand from './AbstractCommand';

//Admin
import GameCommand from './all/admin/Game';
import RestartCommand from './all/admin/Restart';
import DebugCommand from './all/admin/Debug';

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
import PlaylistCommand from './all/music/Playlist';

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
    DebugCommand,
    PlaylistCommand
];

export const processMessage = (message : Message) : boolean => {
    //Strip off mention & obtain split data
    const args = message.content.replace(new RegExp("(^<@[0-9]*> )|(^\!)|(^\/)", "gi"), "").split(/\s+/gi);

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
    try {
        cmdObj.call(message, args);
    } catch (e) {
        Logging.error("CMD_CALL_ERROR", {
            e: e,
            command: cmd,
            args
        });
        CommandTools.volatileReply(message.reply.bind(message), "An error occurred when I tried to execute your command. Please notify a staff member.", 5000, message);
    }

    //Stop chat filter processing
    return true;
};

export {commands};

export default {
    processMessage,
    commands
};
