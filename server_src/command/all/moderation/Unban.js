// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import Infraction from '../../../datatypes/Infraction';
import Logging from '../../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';

class UnbanCommand extends AbstractCommand {

    constructor() {
        super("unban", [
            PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "<user> [[for]reason]", "Unban a banned guild member");
    }
    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        //Verify argument length
        if (args.length < 1) {
            this.tools.volatileReply(reply, this.getUsage(), 5000, msg);
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

        //Retrieve bans from guild
        const bans = await msg.guild.fetchBans();

        //If ban fetch fails, let the user know and stop
        if (!bans) {
            this.tools.volatileReply(reply, "Failed to fetch bans. Please try again.", 5000, msg);
        }

        //Make sure user is banned
        const isBanned = bans.has(uid);

        //If user is not banned, cannot unban, let user know and stop
        if (!isBanned) {
            this.tools.volatileReply(reply, "User is not banned, cannot perform unban.", 5000, msg);
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
            type: 'UNBAN',
            increasedNotoriety: false
        }, null, {
            executor: user.id,
            reason
        }).save());

        //Perform unban
        await msg.guild.unban(uid);

    };

}

export default new UnbanCommand();
