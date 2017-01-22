import AbstractCommand from './AbstractCommand';

import RestartCommand from './all/Restart';
import BanCommand from './all/Ban';
import MuteCommand from './all/Mute';

const commands = [RestartCommand, BanCommand, MuteCommand];

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
        ? AbstractCommand = commands.find(c => c.command.toLowerCase() == cmd.toLowerCase());

    //If none found, stop here
    if (!cmdObj)
        return false;

    //Call the found command
    cmdObj.call(message, args);

    //Stop chat filter processing
    return true;
};

export default {
    processMessage
};
