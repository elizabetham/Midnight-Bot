// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import Infraction from '../../../datatypes/Infraction';
import Logging from '../../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';

class BanCommand extends AbstractCommand {

    constructor() {
        super("ban", [PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {

        //Verify argument length
        if (args.length < 1) {
            this.tools.volatileReply(reply, "The correct usage for the ban command is `ban <user> [reason]`", 5000, msg);
            return;
        }

        //Extract UID from mention
        const uid :
            ? string = this.tools.extractUID(args[0]);

        //If the UID is invalid, let the user know and stop here
        if (!uid) {
            this.tools.volatileReply(reply, "The given user is not a valid target. Please use a mention or UID format.", 5000, msg);
            return;
        }

        //Fetch the guild member for the user to be banned
        const targetMember :
            ? GuildMember = msg.guild.members.array().find(user => user.id == uid);

        //If we found a reference, make sure we're not banning superiors
        if (targetMember && !this.tools.hasPermission(user, _.maxBy(targetMember.roles.array(), r => r.position), false)) {
            this.tools.volatileReply(reply, _.sample(Lang.NO_PERMISSION) + " It's not possible to ban users ranked equally or higher than you.", 5000, msg);
            return;
        }

        //Obtain a reason if it exists
        let reasonArr = args.length == 1
            ? []
            : args.slice(1, args.length);
        if (reasonArr.length > 0 && reasonArr[0].match(/^for$/i))
            reasonArr.shift();
        const reason = reasonArr.length == 0
            ? null
            : _.capitalize(reasonArr.join(" "));

        //Confirm action
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE), 5000, msg);

        //Save an infraction and log it
        await Logging.infractionLog(await new Infraction(uid, moment().unix(), {
            type: 'BAN',
            increasedNotoriety: false
        }, null, {
            executor: user.id,
            reason
        }).save());

        //Execute the ban
        msg.guild.ban(uid, 7);
    };

}

export default new BanCommand();
