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


//Handle message receive event
bot.on('message', message => {

    if (message.content.startsWith("!")) {
        var split = message.content.trim().split(/\s+/);
        var cmd = split[0].substr(1, split[0].length);
        var args = split.splice(1, split.length);
        switch (cmd) {
            case "logpull":
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

                //Construct query
                var query = dbmgr.ActionRecord.find({}).sort({timestamp: -1});
                if (args.length > 0) {
                    if (isNaN(parseInt(args[0]))) {
                        message.reply("```I cannot comply: The first argument provided is not a number.\nUsage: !logpull [amount] [skip]```");
                        return;
                    }
                    query = query.limit(Math.max(0, parseInt(args[0])));
                }
                else {
                    query = query.limit(10);
                }
                if (args.length > 1) {
                    if (isNaN(parseInt(args[1]))) {
                        message.reply("```I cannot comply: The second argument provided is not a number.\nUsage: !logpull [amount] [skip]```");
                        return;
                    }
                    query = query.skip(Math.max(0, parseInt(args[1])));
                }

                //Execute query
                query.exec(function (err, posts) {
                    //Log errors
                    if (err) {
                        processError("!logpull query.exec", err);
                        message.reply("I encountered an error. Please check the log channel to see what went wrong.");
                        return;
                    }

                    var reply = "";
                    if (posts.length == 0) {
                        reply = "No results.";
                    }
                    else {
                        for (var post of posts) {
                            reply += "[" + moment.unix(post.timestamp).format('MMM Do YYYY, h:mm:ss a') + "] " + post.actionType + " (User: " + getUsernameByID(post.userid) + " (" + post.userid + ")) ";
                            if (post.hasOwnProperty("data"))
                                reply += "data: " + post.data;
                            reply += "\n\n";
                        }
                    }
                    if (reply.length <= 2000)
                        message.reply(reply);
                    else
                        message.reply("Too much resulting data. Please use a smaller data set!");
                });
                return;
            case "userinfo":
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

                if (args.length == 0) {
                    message.reply("```I cannot comply: Not enough arguments present.\nUsage: !userinfo <username>```");
                    return;
                }

                var guildmember = getGuildMemberByUsername(args[0], message.guild);
                if (!guildmember) {
                    message.reply("No user found by that name.");
                    return;
                }

                var reply = guildmember.user.username + " (" + guildmember.user.id + ")";
                message.reply(reply);
                return;


        }
    }

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
                    lastWritten: 0,
                    username: message.author.username
                });
            }

            //Increase his infraction level & reset the infraction level timer
            user.infractionLevel++;
            if (user.infractionLevel > 3) user.infractionLevel = 3;
            user.decreaseWhen = moment().unix() + config.leveldrop;

            user.username = message.author.username;
            user.lastWritten = moment().unix();

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

                    //Leave mod log
                    modLog("**[WARN]** issued to _" + message.author.username + " (" + message.author.id + ")_");

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

                    //Leave mod log
                    modLog("**[MUTE]** issued to _" + message.author.username + " (" + message.author.id + ")_");

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

                    //Leave mod log
                    modLog("**[BAN]** issued to _" + message.author.username + " (" + message.author.id + ")_");

                    //Ban user
                    message.member.ban();
                    user.banned = true;

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
}
);

//Schedule checks for unmuting & infraction levels
schedule.scheduleJob('*/30 * * * * *', function () {

    //Decrease infraction levels
    dbmgr.UserRecord.find({infractionLevel: {$gt: 0}, decreaseWhen: {$lte: moment().unix()}, banned: false}, function (err, docs) {
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
                var member = getGuildMemberByID(doc.userid, guild[1]);
                if (!member) continue;
                modLog("**[MUTE LIFT]** issued to _" + member.user.username + " (" + member.user.id + ")_");
                member.removeRole(getRole(guild[1], "Muted"));
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
