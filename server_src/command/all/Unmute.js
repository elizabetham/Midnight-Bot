// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, GuildMember, Role} from 'discord.js';
import Lang from '../Lang';
import Infraction from '../../datatypes/Infraction';
import Logging from '../../utils/Logging';
import moment from 'moment';
import _ from 'lodash';
import DiscordUtils from '../../utils/DiscordUtils';
import UserUtils from '../../utils/UserUtils';
import {UserRecord} from '../../utils/DBManager';
import Config from '../../../config';

class UnmuteCommand extends AbstractCommand {

    constructor() {
        super("unmute", [PERMISSION_PRESETS.CONVICTS.MODERATOR, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => void, user : GuildMember, msg : Message) {

        //Verify argument length
        if (args.length < 1) {
            reply("The correct usage for the unmute command is `unmute <user>`");
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

        //Fetch the user record for the member to be unmuted
        let userRecord : UserRecord = await UserUtils.assertUserRecord(uid);

        //Fetch the guild member for the user to be unmuted
        const targetMember : GuildMember = msg.guild.members.array().find(user => user.id == uid);

        //Fetch mute role
        const muteRole : Role = await DiscordUtils.getRole(msg.guild, "Muted");

        //Check if the user is even muted
        if (!targetMember || (!targetMember.roles.array().find(role => role.id == muteRole.id) && userRecord.mutedUntil == -1)) {
            reply("This user is not muted!");
            return;
        }

        //Confirm action
        reply(_.sample(Lang.AFFIRMATIVE));

        //Save infraction
        const record = await new Infraction(uid, moment().unix(), {
            type: 'MUTE_LIFT',
            increasedNotoriety: false
        },null,{
            executor: user.id
        }).save();

        //Make modlog
        let permalink = Config.baseURL + "/#/infractions/" + record.userid + "/" + record._id;
        Logging.mod(Logging.format("MUTE LIFT", "issued to _" + targetMember.user.username + " (" + uid + ")_: " + permalink + "\n" + "Issued by **" + user.user.username + "**"));

        //Save it to the user record
        userRecord.mutedUntil = -1;
        await userRecord.save();

        //Remove the mute
        if (targetMember) {
            targetMember.removeRole(muteRole);
        }
    };

}

export default new UnmuteCommand();
