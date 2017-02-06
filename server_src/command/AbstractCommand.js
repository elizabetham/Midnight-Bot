// @flow

//Dependencies
import Logging from '../utils/Logging';
import Lang from './Lang';
import _ from 'lodash';
import Tools from './CommandTools'
import DiscordUtils from '../utils/DiscordUtils';

//Types
import {Message, Role, GuildMember} from 'discord.js';
import Permission from '../utils/Permission';

export default class AbstractCommand {

    command : string
    minRoles : Array < Permission >;
    call : (message : Message) => void;
    tools : typeof Tools;
    aliases : Array < string >;
    description : string;
    usage : string;
    getUsage : () => string;

    constructor(command : string, minRoles : Array < Permission >, usage : string, description : string, aliases : Array < string > = []) {
        this.command = command;
        this.minRoles = minRoles;
        this.tools = Tools;
        this.aliases = aliases;
        this.usage = usage;
        this.description = description;

        this.call = this.call.bind(this);
        this.getUsage = this.getUsage.bind(this);
    }

    call(message : Message, args : Array < string >) {
        //Find minimum permission for this guild
        const minPerm :
            ? Permission = this.minRoles.find(role => role.guildId == message.guild.id);

        //If there's none, let the user know.
        if (!minPerm) {
            this.tools.volatileReply(message.reply.bind(message), "This command is not enabled on this guild.", 5000, message);
            return;
        }

        //Do permission checks if the command is not meant for everyone
        if (!minPerm.everyone) {

            //Find the Role instance for this Permission
            const minRole : Role = message.guild.roles.array().find(role => minPerm.roleId == role.id);

            //If it's not found, log an error and let the user know
            if (!minRole) {
                Logging.error("COMMAND_RANK_CHECK", "No Role instance has been found for role '" + minPerm.roleId + "' in guild '" + minPerm.guildId + "'");
                this.tools.volatileReply(message.reply.bind(message), "Due to a change in this guild's role configuration, I cannot comply. Please try again when I am updated.", 5000, message);
                return;
            }

            //Check if the user has permission
            if (message.member == null) {
                //As Discord does not provide member data for offline users, catch that, notify user and abort
                this.tools.volatileReply(message.reply.bind(message), "You cannot use the bot while your Discord status is set to `Invisible`. Please change your status to an online mode and try again.", 5000, message);
                return;
            }
            let hasPermission = message.member && DiscordUtils.hasPermission(message.member, minRole);

            //If the user does not have permission
            if (!hasPermission) {
                this.tools.volatileReply(message.reply.bind(message), _.sample(Lang.NO_PERMISSION), 5000, message);
                return;
            }
        }

        //User has permission, let's execute it.
        try {
            this.exec(args, message.reply.bind(message), message.member, message);
        } catch (e) {
            Logging.error("CMD_EXEC_ERROR", {
                e: e,
                command: this.command,
                args
            });
            this.tools.volatileReply(message.reply.bind(message), "An error occurred I tried to execute your command. Please notify a staff member.", 5000, message);
        }
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) : Promise < void > {
        //Override me
    }

    getUsage(showCorrect : boolean = true) : string {
        return(showCorrect
            ? "Correct usage: "
            : "") + "!" + this.command + " " + this.usage;
    }

}
