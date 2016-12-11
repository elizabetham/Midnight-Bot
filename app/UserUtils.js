'use strict';
//Config
const config = require("../config.js");

//Import dependencies
const moment = require("moment");

//Import modules
const DBManager = require("./DBManager.js");
const DiscordUtils = require("./DiscordUtils.js");

module.exports.increaseNotoriety = (userid) => {
    return new Promise((accept, reject) => {

        //Stop if client has not yet been initialized

        //Find existing record
        DBManager.UserRecord.findOne({userid: userid}, (err, userRecord) => {
            //Error handling
            if (err) {
                reject(err);
                return;
            }

            //Obtain user reference
            DiscordUtils.client.fetchUser(userid).then(user => {

                //Create user record if it does not yet exist
                if (!userRecord) {
                    userRecord = new DBManager.UserRecord({
                        userid: userid,
                        mutedUntil: -1,
                        notoriety: 0,
                        decreaseWhen: -1,
                        username: user.username
                    });
                }

                //Increase the user's notoriety level & reset the notoriety decrease timer
                userRecord.notoriety++;
                if (userRecord.notoriety > 4) userRecord.notoriety = 4; //Enforce ceiling
                userRecord.decreaseWhen = moment().unix() + config.leveldrop;
                userRecord.username = (user.username) ? user.username || null : null;

                //Apply punishment
                let actionType, actionMeta;
                switch (userRecord.notoriety) {
                    case 1:
                        user.sendMessage("In response to your last infraction, you have been issued a warning.");
                        actionType = "WARN";
                        break;
                    case 2:
                        user.sendMessage("In response to your latest infraction, you have been issued a 5 minute mute.");
                        actionType = "MUTE";
                        actionMeta = 300;

                        //Mute user
                        userRecord.mutedUntil = moment().unix() + 300;
                        DiscordUtils.client.guilds.array().forEach(guild => {
                            DiscordUtils.getRole(guild, "Muted").then(role => {
                                guild.members.get(userid).addRole(role);
                            });
                        });
                        break;
                    case 3:
                        user.sendMessage("In response to your latest infraction, you have been issued a 24 hour mute.");
                        actionType = "MUTE";
                        actionMeta = 3600 * 6;

                        //Mute user
                        userRecord.mutedUntil = moment().unix() + 3600 * 6;
                        DiscordUtils.client.guilds.array().forEach(guild => {
                            DiscordUtils.getRole(guild, "Muted").then(role => {
                                guild.members.get(userid).addRole(role)
                            });
                        });
                        break;
                    case 4:
                        //Send PM
                        user.sendMessage("In response to your latest infraction, you have been permanently muted as your record went over the threshold of allowed infractions.");
                        actionType = "MUTE";
                        actionMeta = Number.MAX_SAFE_INTEGER;

                        //Mute user
                        userRecord.mutedUntil = Number.MAX_SAFE_INTEGER;
                        DiscordUtils.client.guilds.array().forEach(guild => {
                            DiscordUtils.getRole(guild, "Muted").then(role => {
                                guild.members.get(userid).addRole(role)
                            });
                        });
                        break;
                    default:
                        reject("Unknown notoriety level");
                        break;
                }

                //Save user record
                userRecord.save(err => {
                    if (err) reject("increaseInfractionLevel() UserRecord SAVE");
                });

                accept({type: actionType, meta: actionMeta});
            }).catch((err) => {
                reject(err);
            });
        });
    });
};
