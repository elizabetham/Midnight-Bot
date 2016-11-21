//Imports
const Discord = require('discord.js');
const config = require('./data/config.js');
const dbmgr = require("./modules/dbmgr.js");
const schedule = require('node-schedule');
const PastebinAPI = require('pastebin-js');
const moment = require("moment");

//Global initializations
const bot = new Discord.Client();
const pastebin = new PastebinAPI(config.PASTEBIN_DEV_KEY);
var botReady = false;

//Notify when ready for use
bot.on('ready', () => {
    console.log('Ready.');
    botReady = true;
});

//Utility functions
var logDiscord = function (msg) {
    if (!botReady) return;
    for (var guild of bot.guilds) {
        for (var channel of guild[1].channels) {
            channel = channel[1];
            if (channel.type == 'text' && channel.name == config.botLogChannel) {
                channel.sendMessage(msg);
            }
        }
    }
};

var getRole = function (guild, rolename) {
    for (var role of guild.roles) {
        if (role[1].name == rolename) return role[1];
    }
    return false;
};

var processError = function (area, err) {
    //Log error to console
    console.log("[" + area + "] " + err);

    //Create pastebin & post in bot log channel
    pastebin.createPaste({
        text: JSON.stringify(err, null, 2),
        privacy: 1,
        title: "["+config.botName+"] Error (Area: " + area + ")"
    }).then(function (data) {
            logDiscord("I encountered an error in area ': http://pastebin.com/" + data);
        })
        .fail(function (err) {
            console.log(err);
            logDiscord("I encountered an error but I could not upload to pastebin!");
        });
};

//Handle message receive event
bot.on('message', message => {
    //Check if the user is applicable for punishment
    if (message.author.bot || config.prohibitedMentions.indexOf(message.author.username) > -1 || config.notAffected.indexOf(message.author.username) > -1) return;

    //Check if the message has mentioned a person on the list
    var contains = false;
    for (var user of message.mentions.users) {
        if (config.prohibitedMentions.indexOf(user[1].username) > -1) {
            contains = true;
            break;
        }
    }

    //Take action if it was not allowed
    if (contains) {
        //Find the record of this user
        dbmgr.UserRecord.findOne({userid: message.author.id}, function (err, user) {

            //Log errors
            if (err) {
                processError("findOne UserRecord", err);
                return;
            }

            //Create user if it does not yet exist
            if (!user) {
                user = new dbmgr.UserRecord({
                    userid: message.author.id,
                    banned: false,
                    mutedUntil: -1,
                    infractionLevel: 0,
                    decreaseWhen: -1,
                });
            }

            //Increase his infraction level & reset the infraction level timer
            user.infractionLevel++;
            if (user.infractionLevel > 3) user.infractionLevel = 3;
            user.decreaseWhen = moment().unix() + config.leveldrop;

            //Save action log
            new dbmgr.ActionRecord({
                userid: user.userid,
                timestamp: moment().unix(),
                data: "NEW LEVEL: " + user.infractionLevel,
                actionType: "INCREASE INFRACTION LEVEL"
            }).save(function (err) {
                if (err)
                    processError("save ActionRecord", err);
            });

            //Delete the message
            message.delete();

            var pms = [
                "It is not permitted to mention Meme-Team members directly. This rule is in place to prevent those members from being spammed.\n\n**This is a warning**",
                "It is not permitted to mention Meme-Team members directly. This rule is in place to prevent those members from being spammed.\n\n**You have been muted for a small period of time**",
                "It is not permitted to mention Meme-Team members directly. This rule is in place to prevent those members from being spammed.\n\n**Since you have been ignoring your previous warnings, you have been permanently banned.**",
            ];

            //Apply punishment
            switch (user.infractionLevel) {
                case 1:
                    //Send PM
                    message.author.sendMessage(pms[0]);

                    //Save action log
                    new dbmgr.ActionRecord({
                        userid: user.userid,
                        timestamp: moment().unix(),
                        actionType: "WARN"
                    }).save(function (err) {
                        if (err)
                            processError("save ActionRecord", err);
                    });
                    break;
                case 2:
                    //Send PM
                    message.author.sendMessage(pms[1]);

                    //Mute user
                    user.mutedUntil = moment().unix() + config.mutetime;
                    var mutedRole = getRole(message.guild, "Muted");
                    if (mutedRole) message.member.addRole(mutedRole);

                    //Save action log
                    new dbmgr.ActionRecord({
                        userid: user.userid,
                        timestamp: moment().unix(),
                        actionType: "MUTE"
                    }).save(function (err) {
                        if (err)
                            processError("save ActionRecord", err);
                    });

                    break;
                case 3:
                    //Send PM
                    message.author.sendMessage(pms[2]);

                    //Ban user
                    message.member.ban();

                    //Save action log
                    new dbmgr.ActionRecord({
                        userid: user.userid,
                        timestamp: moment().unix(),
                        actionType: "BAN"
                    }).save(function (err) {
                        if (err)
                            processError("save ActionRecord", err);
                    });
                    break;
                default:
                    //Nothing here (yet)
                    break;
            }

            //Save user
            user.save(function (err) {
                if (err) processError("save UserRecord", err);
            });

        });
    }
});

//Schedule checks for unmuting & infraction levels
schedule.scheduleJob('*/10 * * * * *', function () {

    //Decrease infraction levels
    dbmgr.UserRecord.find({infractionLevel: {$gt: 0}, decreaseWhen: {$lte: moment().unix()}}, function (err, docs) {
        for (var doc of docs) {
            if (doc == null) continue;

            //Save action log
            new dbmgr.ActionRecord({
                userid: doc.userid,
                timestamp: moment().unix(),
                actionType: "DECREASE INFRACTION LEVEL",
                data: "NEW LEVEL: " + (doc.infractionLevel - 1)
            }).save(function (err) {
                if (err)
                    processError("save ActionRecord", err);
            });

            //Remove or update record
            if (doc.infractionLevel == 1) {
                doc.remove(function (err) {
                    if (err)
                        processError("remove UserRecord 1", err);
                });
            }
            else {
                doc.infractionLevel--;
                doc.decreaseWhen = moment().unix() + config.leveldrop;
                doc.save(function (err) {
                    if (err)
                        processError("save UserRecord", err);
                });
            }
        }
    });

    //Unmute peeps
    dbmgr.UserRecord.find({mutedUntil: {$gt: 0, $lte: moment().unix()}}, function (err, docs) {
        if (err) {
            processError("find UserRecord", err);
            return;
        }
        for (var doc of docs) {
            if (doc == null) continue;

            //Reset muted timestamp
            doc.mutedUntil = -1;

            //Save action log
            new dbmgr.ActionRecord({
                userid: doc.userid,
                timestamp: moment().unix(),
                actionType: "UNMUTE"
            }).save(function (err) {
                if (err)
                    processError("save ActionRecord", err);
            });

            //Remove muted roles
            for (var guild of bot.guilds) {
                guild[1].fetchMember(doc.userid).then(
                    function (member) {
                        member.removeRole(getRole(guild[1], "Muted"));
                    },
                    function (err) {
                        if (err)
                            processError("guild fetchMember", err);
                    }
                );
            }

            //Save user record
            doc.save(function (err) {
                if (err)
                    processError("save UserRecord", err);
            });
        }
    });

    //Remove level 0 peeps to reduce DB clutter
    dbmgr.UserRecord.remove({infractionLevel: 0}, function (err) {
        if (err) processError("remove UserRecord 2", err);
    });
});


//Login to discord
bot.login(config.botToken);

