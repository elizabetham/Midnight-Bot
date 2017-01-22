// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../Lang';
import Infraction from '../../datatypes/Infraction';
import Logging from '../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';
import DiscordUtils from '../../utils/DiscordUtils';
import UserUtils from '../../utils/UserUtils';

class MuteCommand extends AbstractCommand {

    constructor() {
        super("mute", [PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => void, user : GuildMember, msg : Message) {

        //Verify argument length
        if (args.length < 2) {
            reply("The correct usage for the mute command is `mute <user> <duration|forever> [reason]`");
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

        //Fetch the guild member for the user to be muted
        const targetMember :
            ? GuildMember = msg.guild.members.array().find(user => user.id == uid);

        //If we found a reference, make sure we're not muting superiors
        if (targetMember && !this.tools.hasPermission(user, _.maxBy(targetMember.roles.array(), r => r.position), false)) {
            reply(_.sample(Lang.NO_PERMISSION) + " It's not possible to mute users ranked equally or higher than you.");
            return;
        }

        //Obtain duration:
        if (args[1].toLowerCase() != 'forever' && args.length < 3) {
            reply("The correct usage for the mute command is `mute <user> <duration|forever> [reason]`");
            return;
        }

        const duration :
            ? number = args[1].toLowerCase() == 'forever'
                ? Number.MAX_SAFE_INTEGER
                : this.tools.parseTime(args[1] + " " + args[2]);

        if (!duration) {
            reply("I don't understand your duration definition of '" + args[1] + " " + args[2] + "'!");
            return;
        }

        //Obtain a reason if it exists
        let reasonArr = args[1].toLowerCase() == 'forever'
            ? args.slice(2, args.length)
            : args.slice(3, args.length);
        if (reasonArr.length > 0 && reasonArr[0].match(/^for$/i)) reasonArr.shift();
        const reason = reasonArr.length == 0
            ? null
            : reasonArr.join(" ");

        //Confirm action
        reply(_.sample(Lang.AFFIRMATIVE));

        //Save an infraction and log it
        await Logging.infractionLog(await new Infraction(uid, moment().unix(), {
            type: 'MUTE',
            increasedNotoriety: false,
            meta: duration
        }, null, {
            executor: user.id,
            reason
        }).save());

        //Obtain the user record of the target user
        let userRecord = await UserUtils.assertUserRecord(uid);

        //Apply the mute
        if (targetMember) {
            targetMember.addRole(await DiscordUtils.getRole(msg.guild, "Muted"));
        }

        //Save it to the user record
        userRecord.mutedUntil = moment().unix() + duration;
        await userRecord.save();
    };

}

export default new MuteCommand();
