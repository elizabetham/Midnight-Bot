// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../Lang';
import Infraction from '../../datatypes/Infraction';
import Logging from '../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';

class BanCommand extends AbstractCommand {

    constructor() {
        super("ban", [PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => void, user : GuildMember, msg : Message) {

        //Verify argument length
        if (args.length < 1) {
            reply("The correct usage for the ban command is `ban <user> [reason]`");
            return;
        }

        //Extract UID from mention
        const uid :
            ? string = this.tools.extractUID(args[0]);

        //If the UID is invalid, let the user know and stop here
        if (!uid) {
            reply("The given user is not a valid target. Please use a mention or UID format.");
            return;
        }

        //Fetch the guild member for the user to be banned
        const targetMember :
            ? GuildMember = msg.guild.members.array().find(user => user.id == uid);

        //If we found a reference, make sure we're not banning superiors
        if (targetMember && !this.tools.hasPermission(user, _.maxBy(targetMember.roles.array(), r => r.position), false)) {
            reply(_.sample(Lang.NO_PERMISSION) + " It's not possible to ban users ranked higher than you.");
            return;
        }

        //Obtain a reason if it exists
        const reason = args.length == 1
            ? null
            : args.slice(1, args.length).join(" ");

        //Confirm action
        reply(_.sample(Lang.AFFIRMATIVE));

        //Save an infraction and log it
        await Logging.infractionLog(await new Infraction(uid, moment().unix(), {
            type: 'BAN',
            increasedNotoriety: false
        }, null, {
            executor: user.id,
            reason
        }).save());

        //Execute the ban
        msg.guild.ban(uid);
    };

}

export default new BanCommand();
