// @flow

//Dependencies
import Logging from '../utils/Logging';
import Lang from './Lang';
import _ from 'lodash';

//Types
import {Message, Role} from 'discord.js';
import Permission from './Permission';

export default class AbstractCommand {

    command : string

    minRoles : Array < Permission >;

    call : (message : Message) => void;

    constructor(command : string, minRoles : Array < Permission >) {
        this.command = command;
        this.minRoles = minRoles;
        this.call = this.call.bind(this);
    }

    call(message : Message, args : Array < string >) {
        //Find minimum permission for this guild
        const minPerm :
            ? Permission = this.minRoles.find(role => role.guildId == message.member.guild.id);

        //If there's none, let the user know.
        if (!minPerm) {
            message.reply("This command is not enabled on this guild.");
            return;
        }

        console.log("MINPERM", minPerm);

        //Do permission checks if the command is not meant for everyone
        if (!minPerm.everyone) {

            //Find the Role instance for this Permission
            const minRole : Role = message.guild.roles.array().find(role => minPerm.roleId == role.id);

            //If it's not found, log an error and let the user know
            if (!minRole) {
                Logging.error("COMMAND_RANK_CHECK", "No Role instance has been found for role '" + minPerm.roleId + "' in guild '" + minPerm.guildId + "'");
                message.reply("Due to a change in this guild's role configuration, I cannot comply. Please try again when I am updated.");
                return;
            }

            //Check if the user has Permission
            let hasPermission = (message.member.roles.array().find(role => role.name.toUpperCase() == "BOTDEV") || message.member.roles.array().filter(role => role.comparePositionTo(minRole) >= 0).count > 0);

            //If the user does not have permission
            if (!hasPermission) {
                message.reply(_.sample(Lang.NO_PERMISSION));
                return;
            }
        }

        //User has permission, let's execute it.
        this.exec(args, message);
    }

    exec(args : Array < string >, message : Message) {
        //Override me
    }

}
