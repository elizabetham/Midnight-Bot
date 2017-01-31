// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import Infraction from '../../../datatypes/Infraction';
import Logging from '../../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';
import DiscordUtils from '../../../utils/DiscordUtils';
import Dispatcher from '../../Dispatcher';

class HelpCommand extends AbstractCommand {

    constructor() {
        super("help", [
            PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], "[command]", "List Midnight's help");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        msg.delete();

        let help = "";

        if (args.length == 0) {
            //
            //Default help
            //

            help = "Hi there! My name's **Midnight**, the resident bot at **The Convicts**!\n\n";
            help += "My main tasks are to handle day to day moderation and play some tunes in our music channel.\n";
            help += "My web interface is located at http://midnight.bemacized.net/.\n";
            help += "Below you'll find the explanation for all of my available commands.\n\n"

            Dispatcher.commands.forEach(cmdObj => {
                let minRole = cmdObj.minRoles.find(role => role.guildId == msg.guild.id);
                if (!minRole || DiscordUtils.hasPermission(user, minRole, true)) {
                    help += "**!" + cmdObj.command + "**: _" + cmdObj.description + "_\n";
                    help += "Usage: `" + cmdObj.getUsage(false) + "`\n";
                    if (cmdObj.aliases.length > 0) {
                        help += "Alias(es): _" + cmdObj.aliases.map(a => "!" + a).join(", ") + "_\n";
                    }
                    if (minRole && minRole.getRole().name != "@everyone") {
                        help += "Minimum Role: **" + minRole.getRole().name + "**\n";
                    }
                    help += "\n";
                }
            });

            help += "If you still have any questions about me, feel free to ask any of our staff members and I'm sure they'll be happy to help.\n\n";
            help += "In case you would like to contact us regarding my development, be it to report a bug or just out of plain interest, feel free to contact my main developer, @BeMacized.";
            help += "You can find my source code over at https://github.com/BeMacized/Midnight-Bot.";
        } else {
            //
            //Command specific help
            //

            //Attempt finding a relevant command class
            const cmdObj :
                ? AbstractCommand = Dispatcher.commands.find(c => c.command.toLowerCase() == args[0].toLowerCase() || c.aliases.indexOf(args[0].toLowerCase()) > -1);

            //If none found, stop here
            if (!cmdObj) {
                this.tools.volatileReply(reply, "No command with name or alias `" + args[0] + "` found.", 5000);
                return;
            }

            //Build help
            let minRole = cmdObj.minRoles.find(role => role.guildId == msg.guild.id);
            help += "**Command:** !" + cmdObj.command + ": _" + cmdObj.description + "_\n";
            help += "Usage: `" + cmdObj.getUsage(false) + "`\n";
            if (cmdObj.aliases.length > 0) {
                help += "Alias(es): _" + cmdObj.aliases.map(a => "!" + a).join(", ") + "_\n";
            }
            if (minRole && minRole.getRole().name != "@everyone") {
                help += "Minimum Role: **" + minRole.getRole().name + "**\n";
            }

        }

        user.sendMessage(help, {split: true});
    };

}

export default new HelpCommand();
