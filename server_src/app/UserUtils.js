// @flow

//Config
import Config from "../config";

//Import dependencies
import moment from 'moment';
import type {$InfractionAction}
from './Infraction';

//Import modules
import {UserRecord} from './DBManager';
import DiscordUtils from './DiscordUtils';
import Logging from './Logging';

export async function assertUserRecord(userid : string) : UserRecord {
    let userRecord: UserRecord = await UserRecord.findOne({userid: userid});
    if (!userRecord) {
        let user = await DiscordUtils.client.fetchUser(userid);
        userRecord = new UserRecord({
            userid: userid,
            mutedUntil: -1,
            notoriety: 0,
            decreaseWhen: -1,
            username: user.username,
            username_lower: user.username.toLowerCase()
        });
        await userRecord.save(err => {
            if (err)
                Logging.error("ASSERT_USER_RECORD_SAVE", err)
        });
    }
    return userRecord;
};

export async function increaseNotoriety(userid : string) : Promise < $InfractionAction > {

    //Find existing record
    let userRecord = await assertUserRecord(userid);

    //Obtain user reference
    let user = await DiscordUtils.client.fetchUser(userid);

    //Increase the user's notoriety level & reset the notoriety decrease timer
    userRecord.notoriety++;
    if (userRecord.notoriety > 5)
        userRecord.notoriety = 5; //Enforce ceiling
    userRecord.decreaseWhen = moment().unix() + Config.leveldrop;
    userRecord.username = (user.username)
        ? user.username || null
        : null;

    //Apply punishment
    let InfractionAction = {
        type: 'NONE',
        increasedNotoriety: true
    }
    switch (userRecord.notoriety) {
        case 1:
        case 2:
            user.sendMessage("In response to your last infraction, you have been issued a warning.");
            InfractionAction = {
                type: 'WARN',
                increasedNotoriety: true
            };
            break;
        case 3:
            user.sendMessage("In response to your latest infraction, you have been issued a 5 minute mute.");
            InfractionAction = {
                type: 'MUTE',
                increasedNotoriety: true,
                meta: 300
            };

            //Mute user
            userRecord.mutedUntil = moment().unix() + 300;
            DiscordUtils.client.guilds.array().forEach(async(guild) => {
                let role = await DiscordUtils.getRole(guild, "Muted");
                await guild.members.get(userid).addRole(role);
            });
            break;
        case 4:
            user.sendMessage("In response to your latest infraction, you have been issued a 24 hour mute.");
            InfractionAction = {
                type: 'MUTE',
                increasedNotoriety: true,
                meta: 3600 * 6
            };

            //Mute user
            userRecord.mutedUntil = moment().unix() + 3600 * 6;
            DiscordUtils.client.guilds.array().forEach(async(guild) => {
                let role = await DiscordUtils.getRole(guild, "Muted");
                await guild.members.get(userid).addRole(role);
            });

            break;
        case 5:
            //Send PM
            user.sendMessage("In response to your latest infraction, you have been permanently muted as your record went over the threshold of allowed infractions.");
            InfractionAction = {
                type: 'MUTE',
                increasedNotoriety: true,
                meta: Number.MAX_SAFE_INTEGER
            };

            //Mute user
            userRecord.mutedUntil = Number.MAX_SAFE_INTEGER;
            DiscordUtils.client.guilds.array().forEach(async(guild) => {
                let role = await DiscordUtils.getRole(guild, "Muted");
                await guild.members.get(userid).addRole(role);
            });
            break;
    }

    //Save user record
    await userRecord.save();

    return InfractionAction;
};

export default {
    increaseNotoriety,
    assertUserRecord
};
