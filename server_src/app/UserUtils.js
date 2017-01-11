'use strict';
//Config
const config = require("../config.js");

//Import dependencies
const moment = require("moment");

//Import modules
const DBManager = require("./DBManager.js");
const DiscordUtils = require("./DiscordUtils.js");

module.exports.assertUserRecord = async(userid) => {
    let userRecord = await DBManager.UserRecord.findOne({userid: userid});
    if (!userRecord) {
        let user = await DiscordUtils.client.fetchUser(userid);
        userRecord = new DBManager.UserRecord({
            userid: userid,
            mutedUntil: -1,
            notoriety: 0,
            decreaseWhen: -1,
            username: user.username,
            username_lower: user.username.toLowerCase()
        });
    }
    return userRecord;
};

module.exports.increaseNotoriety = async(userid) => {

    //Find existing record
    let userRecord = await module.exports.assertUserRecord(userid);

    //Obtain user reference
    let user = await DiscordUtils.client.fetchUser(userid);

    //Increase the user's notoriety level & reset the notoriety decrease timer
    userRecord.notoriety++;
    if (userRecord.notoriety > 5) userRecord.notoriety = 5; //Enforce ceiling
    userRecord.decreaseWhen = moment().unix() + config.leveldrop;
    userRecord.username = (user.username) ? user.username || null : null;

    //Apply punishment
    let actionType, actionMeta;
    switch (userRecord.notoriety) {
        case 1:
        case 2:
            user.sendMessage("In response to your last infraction, you have been issued a warning.");
            actionType = "WARN";
            break;
        case 3:
            user.sendMessage("In response to your latest infraction, you have been issued a 5 minute mute.");
            actionType = "MUTE";
            actionMeta = 300;

            //Mute user
            userRecord.mutedUntil = moment().unix() + 300;
            DiscordUtils.client.guilds.array().forEach(async(guild) => {
                let role = await DiscordUtils.getRole(guild, "Muted");
                await guild.members.get(userid).addRole(role);
            });
            break;
        case 4:
            user.sendMessage("In response to your latest infraction, you have been issued a 24 hour mute.");
            actionType = "MUTE";
            actionMeta = 3600 * 6;

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
            actionType = "MUTE";
            actionMeta = Number.MAX_SAFE_INTEGER;

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

    return {type: actionType, meta: actionMeta};
};
