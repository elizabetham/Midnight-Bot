//Imports
const Discord = require('discord.js');
const config = require('./data/config.js');
const dbmgr = require("./modules/dbmgr.js");
const schedule = require('node-schedule');
const PastebinAPI = require('pastebin-js');
const moment = require("moment");
const emojiRegex = require('emoji-regex');
const emojione = require('emojione');

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
var getTextChannel = function (name, exec) {
    for (var guild of bot.guilds) {
        for (var channel of guild[1].channels) {
            channel = channel[1];
            if (channel.type == 'text' && channel.name == name) {
                exec(channel);
            }
        }
    }
};

var botLog = function (msg) {
    if (!botReady) return;
    getTextChannel(config.botLogChannel, function (channel) {
        channel.sendMessage(msg);
    });
};

var modLog = function (msg) {
    if (!botReady) return;
    getTextChannel(config.botModChannel, function (channel) {
        channel.sendMessage(msg);
    });
};

var getRole = function (guild, rolename) {
    for (var role of guild.roles) {
        if (role[1].name == rolename) return role[1];
    }
    return false;
};

var getUserByID = function (userid) {
    for (var guild of bot.guilds) {
        var guildmember = getGuildMemberByID(userid, guild[1]);
        if (guildmember) return guildmember.user;
    }
    return false;
};

var getGuildMemberByID = function (userid, guild) {
    for (var member of guild.members) {
        if (member[0] == userid) {
            return member[1];
        }
    }
    return false;
};

var getGuildMemberByUsername = function (username, guild) {
    for (var member of guild.members) {
        if (member[1].user.username == username) {
            return member[1];
        }
    }
    return false;
};

var getUsernameByID = function (userid) {
    var user = getUserByID(userid);
    return (user) ? user.username : "UnknownName";
};

var increaseInfractionLevel = function (guild, user, modLogReason, triggerMessage) {

    if (!guild || !user) return;

    dbmgr.UserRecord.findOne({userid: user.id}, function (err, userRecord) {

        //Log errors
        if (err) {
            processError("increaseInfractionLevel() UserRecord findOne", err);
            return;
        }

        //Create user if it does not yet exist
        if (!userRecord) {
            userRecord = new dbmgr.UserRecord({
                userid: user.id,
                banned: false,
                mutedUntil: -1,
                infractionLevel: 0,
                decreaseWhen: -1,
                lastWritten: 0,
                username: user.username
            });
        }

        //Increase his infraction level & reset the infraction level timer
        userRecord.infractionLevel++;
        if (userRecord.infractionLevel > 4) userRecord.infractionLevel = 4;
        userRecord.decreaseWhen = moment().unix() + config.leveldrop;
        userRecord.username = user.username;
        userRecord.lastWritten = moment().unix();

        var actionType = "UNKNOWN";
        var data = {};

        //Apply punishment
        switch (userRecord.infractionLevel) {
            case 1:
                //Send PM
                user.sendMessage("In response to your last infraction, you have been issued a warning.");

                //Leave mod log
                modLog("**[WARN]** issued to _" + user.username + " (" + user.id + ")_\n**Reason:** " + modLogReason);

                //Set action log data
                actionType = "WARN";
                data = {infractionLevel: userRecord.infractionLevel};
                break;
            case 2:
                //Send PM
                user.sendMessage("In response to your latest infraction, you have been issued a 5 minute mute.");

                //Mute user
                userRecord.mutedUntil = moment().unix() + 300;
                var mutedRole = getRole(guild, "Muted");
                if (mutedRole) getGuildMemberByID(user.id, guild).addRole(mutedRole);

                //Leave mod log
                modLog("**[5min MUTE]** issued to _" + user.username + " (" + user.id + ")_\n**Reason:** " + modLogReason);

                //Set action log data
                actionType = "MUTE1";
                data = {infractionLevel: userRecord.infractionLevel, duration: 300};
                break;
            case 3:
                //Send PM
                user.sendMessage("In response to your latest infraction, you have been issued a 24 hour mute.");

                //Mute user
                userRecord.mutedUntil = moment().unix() + 3600 * 6;
                var mutedRole = getRole(guild, "Muted");
                if (mutedRole) getGuildMemberByID(user.id, guild).addRole(mutedRole);

                //Leave mod log
                modLog("**[6hr MUTE]** issued to _" + user.username + " (" + user.id + ")_\n**Reason:** " + modLogReason);

                //Set action log data
                actionType = "MUTE2";
                data = {infractionLevel: userRecord.infractionLevel, duration: 3600 * 6};
                break;
            case 4:
                //Send PM
                user.sendMessage("In response to your latest infraction, you have been permanently muted as your record went over the threshold of allowed infractions.");

                //Mute user
                userRecord.mutedUntil = Number.MAX_SAFE_INTEGER;
                var mutedRole = getRole(guild, "Muted");
                if (mutedRole) getGuildMemberByID(user.id, guild).addRole(mutedRole);

                //Leave mod log
                modLog("**[PERM MUTE]** issued to _" + user.username + " (" + user.id + ")_\n**Reason:** " + modLogReason);

                //Set action log data
                actionType = "MUTEPERM";
                data = {infractionLevel: userRecord.infractionLevel, duration: -1};
                break;
            default:
                //Nothing here (yet)
                break;
        }

        //Construct and save action record
        var record = {
            userid: user.id,
            timestamp: moment().unix(),
            actionType: actionType,
            data: data
        };
        if (triggerMessage) record["triggerMessage"] = triggerMessage;
        new dbmgr.ActionRecord(record).save(function (err) {
            if (err) processError("increaseInfractionLevel() ActionRecord save", err);
        });

        //Save user record
        userRecord.save(function (err) {
            if (err) processError("increaseInfractionLevel() UserRecord save", err);
        });
    });
};

var processError = function (area, err) {
    //Log error to console
    console.log("[" + area + "] " + err);

    //Create pastebin & post in bot log channel
    pastebin.createPaste({
        text: JSON.stringify(err, null, 2),
        privacy: 1,
        title: "[" + config.botName + "] Error (Area: " + area + ")"
    })
        .then(function (data) {
            botLog("I encountered an error in area '" + area + "': <http://pastebin.com/" + data + ">");
        })
        .fail(function (err) {
            console.log(err);
            botLog("I encountered an error but I could not upload to pastebin!");
        });
};

//Handle member joining
bot.on('guildMemberAdd', guildMember => {
    //Verify mute state to combat mute evasion
    dbmgr.UserRecord.findOne({
        userid: guildMember.user.id
    }, function (err, userRecord) {
        //Process error
        if (err) {
            processError("guildMemberAdd UserRecord findOne", err);
            console.log(err);
            return;
        }

        //Stop if no record of this user exists yet
        if (!userRecord) return;

        //Check if user should be muted
        if (userRecord.mutedUntil > moment().unix()) {
            //Reapply mute
            var mutedRole = getRole(guildMember.guild, "Muted");
            if (mutedRole) guildMember.addRole(mutedRole);

            //Leave log
            modLog("**[MUTE EVASION DETECTED]** By user _" + guildMember.user.username + " (" + guildMember.user.id + ")_");

            //Save action log
            new dbmgr.ActionRecord({
                userid: guildMember.user.id,
                timestamp: moment().unix(),
                actionType: "REMUTE"
            }).save(function (err) {
                if (err)
                    processError("guildMemberAdd ActionRecord save", err);
            });
        }
    });

});

//Handle message receive event
bot.on('message', message => {

        if (!message.guild) return;

        //Start command detections
        if (message.content.startsWith("!")) {
            var split = message.content.trim().split(/\s+/);
            var cmd = split[0].substr(1, split[0].length);
            var args = split.splice(1, split.length);
            switch (cmd) {
                case "infractions": {
                    //Check permissions
                    var member = getGuildMemberByID(message.author.id, message.guild);
                    var hasperms = false;
                    for (var role of member.roles) {
                        if (role[1].name == config.botDevRole) {
                            hasperms = true;
                            break;
                        }
                    }
                    if (!hasperms)
                        return;

                    //Verify arguments
                    if (args.length == 0) {
                        message.reply("```I cannot comply: Not enough arguments present.\nUsage: !infractions <userId>```");
                        return;
                    }

                    //Obtain guild member object from argument
                    var guildmember = getGuildMemberByID(args[0], message.guild);
                    if (!guildmember) {
                        message.reply("No user found by that id.");
                        return;
                    }

                    //Construct query
                    var query = dbmgr.ActionRecord.find({userid: guildmember.user.id}).sort({timestamp: -1});
                    query = query.limit(5);

                    //Execute query
                    query.exec(function (err, posts) {
                        //Log errors
                        if (err) {
                            processError("!infractions query.exec", err);
                            message.reply("I encountered an error. Please check the log channel to see what went wrong.");
                            return;
                        }

                        //Start constructing reply
                        var reply = "";
                        if (posts.length == 0) {
                            message.reply("No results.");
                        }
                        else {
                            //Add infractions to the reply
                            for (var post of posts) {
                                reply += "[" + moment.unix(post.timestamp).format('MMM Do YYYY, h:mm:ss a') + "]";
                                reply += "\nAction: " + post.actionType;
                                reply += "\nUser: " + getUsernameByID(post.userid) + " (" + post.userid + ")";
                                if (post.triggerMessage) reply += "\nTrigger Message: \n------------------------\n" + emojione.toShort(post.triggerMessage) + "\n------------------------";
                                reply += "\n\n\n";
                            }

                            if (reply.length < 2000 - 6) {
                                //Send reply in text
                                message.reply("```" + reply + "```");
                            } else {
                                //Upload reply to pastebin if it is too long
                                pastebin.createPaste({
                                    text: reply,
                                    privacy: 1,
                                    title: "Infractions: " + getUsernameByID(post.userid)
                                })
                                    .then(function (data) {
                                        message.reply("The infraction data has been uploaded to pastebin: <http://pastebin.com/" + data + ">");
                                    })
                                    .fail(function (err) {
                                        console.log(err);
                                        botLog("The infraction data is too long to be posted and pastebin refused to take it instead.");
                                    });
                            }
                        }
                    });
                    return;
                }
            }
        }
        //End of command detections

        //Start of chatfilters
        if (!message.author.bot && config.notAffected.indexOf(message.author.username) == -1) {

            var triggered = false;

            //Check for Grandmaster Gang mentions
            for (var user of message.mentions.users) {
                if (config.prohibitedMentions.indexOf(user[1].username) > -1) {
                    //Remove the message
                    message.delete();
                    //PM the infraction message
                    message.author.sendMessage("You have been issued an infraction: It is not permitted to mention members from the 'Grandmaster Gang' directly.");
                    //Execute applicable punishment
                    increaseInfractionLevel(message.guild, message.author, "Mentioning a 'Grandmaster Gang' member in a message. (" + user[1].username + ")", message.content);
                    triggered = true;
                    break;
                }
            }

            //Check for spam filter regex triggers
            if (!triggered) {
                for (var rule of [
                    [/.*([^.\s])\1{6,}.*/gi, 1, "Repeated Character Filter"], //repeated characters
                    [/.*b+a+z+a{4,}.*/gi, 1, "Bazza Filter"], //Bazza filter
                    [emojiRegex(), 10, "Emoji Filter"], //emojis
                    [/.*<@{5,}.*/gi, 1, "Mention Spam Filter"] //mass mentioning
                ]) {
                    var occurred = message.content.match(rule[0]);
                    if (!occurred) continue;
                    if (occurred.length >= rule[1]) {
                        //Remove the message
                        message.delete();
                        //PM the infraction message
                        message.author.sendMessage("You have been issued an infraction: Spamming messages or posting messages with spam-like content is not permitted.");
                        //Execute applicable punishment
                        increaseInfractionLevel(message.guild, message.author, "Posting a message with spam-content (" + rule[2] + ")", message.content);
                        triggered = true;
                        break;
                    }
                }
            }

            //Check for discord invite links
            if (!triggered && message.content.match(/.*discord\.gg\/.*/gi)) {
                //Remove the message
                message.delete();
                //PM the infraction message
                message.author.sendMessage("You have been issued an infraction: It is not allowed to advertise other Discord servers in our guild.");
                //Execute applicable punishment
                increaseInfractionLevel(message.guild, message.author, "Posting a Discord server invite url", message.content);
                triggered = true;
            }

            //Check for language filters
            if (!triggered) {
                for (var rule of [
                    [/.*\bn+(i|1)+(g|6)+((a|4)+|(e|3)+r*|u+)h*s*\b.*/gi, "Nigger Filter"],
                    [/.*\bj+(e|3)+w+s*\b.*/gi, "Jew Filter"],
                    [/.*\bf+(4|a)*g+(e|3|o|0)*t*s*\b.*/gi, "Fag Filter"]
                ]) {
                    if (message.content.match(rule[0])) {
                        //Remove the message
                        message.delete();
                        //PM the infraction message
                        message.author.sendMessage("You have been issued an infraction: The use of racist or discriminative terms is not permitted here.");
                        //Execute applicable punishment
                        increaseInfractionLevel(message.guild, message.author, "Posting a racist or discriminative term (" + rule[1] + ")", message.content);
                        triggered = true;
                    }
                }
            }
        }
        //End of chatfilters
    }
);


//Schedule checks for unmuting & infraction levels
schedule.scheduleJob('*/10 * * * * *', function () {

    //Decrease infraction levels
    dbmgr.UserRecord.find({
        infractionLevel: {$gt: 0},
        decreaseWhen: {$lte: moment().unix()},
        banned: false
    }, function (err, docs) {
        for (var doc of docs) {
            if (doc == null) continue;

            //Remove or update record
            if (doc.infractionLevel == 1) {
                doc.remove(function (err) {
                    if (err)
                        processError("cron UserRecord remove", err);
                });
            }
            else {
                doc.infractionLevel--;
                doc.decreaseWhen = moment().unix() + config.leveldrop;
                doc.save(function (err) {
                    if (err)
                        processError("cron UserRecord save", err);
                });
            }
        }
    });

    //Unmute peeps
    dbmgr.UserRecord.find({mutedUntil: {$gt: 0, $lte: moment().unix()}}, function (err, docs) {
        if (err) {
            processError("cron UserRecord find", err);
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
                    processError("cron ActionRecord save", err);
            });

            //Remove muted roles
            for (var guild of bot.guilds) {
                var member = getGuildMemberByID(doc.userid, guild[1]);
                if (!member) continue;
                modLog("**[MUTE LIFT]** issued to _" + member.user.username + " (" + member.user.id + ")_");
                member.removeRole(getRole(guild[1], "Muted"));
            }

            //Save user record
            doc.save(function (err) {
                if (err)
                    processError("cron UserRecord save", err);
            });
        }
    });

    //Remove level 0 peeps to reduce DB clutter
    dbmgr.UserRecord.remove({infractionLevel: 0}, function (err) {
        if (err) processError("cron UserRecord remove", err);
    });
});


//Login to discord
bot.login(config.botToken);
