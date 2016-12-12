//Modules
const DiscordUtils = require("./DiscordUtils.js");
const DBManager = require("./DBManager.js");
const Logging = require("./Logging.js");
const ChatFilters = require("./ChatFilters.js");

//Config
const config = require("../config.js");

//Dependencies
const moment = require("moment");
const pastebin = new (require('pastebin-js'))(config.PASTEBIN_DEV_KEY);


//Notify when ready for use
DiscordUtils.client.on('ready', () => {
    console.log('Discord connection ready.');
    //Set the avatar of the bot
    DiscordUtils.client.user.setAvatar("./app/res/img/avatar.png");
});

//Handle member joining
DiscordUtils.client.on('guildMemberAdd', guildMember => {
    combatMuteEvasion(guildMember)
});

//Handle message receive event
DiscordUtils.client.on('message', message => {
        //Prevent bot from using itself
        if (!message.author.bot) return;
        //Disable PM
        if (!message.guild) return;
        //Command detection
        if (message.content.startsWith("!")) {
            processCommand(message);
            return;
        }
        //Check if user is on role whitelist
        if (message.member.roles.array.filter(r => config.whitelistedRoles.indexOf(r.id) > -1).length == 0) ChatFilters.process(message);
    }
);

let processCommand = message => {

    /*
     TODO: BREAK OUT INTO COMMAND FRAMEWORK & CLEAN UP THIS HORRIBLE COMMAND MESS.
     _I'm sorry this shit was written in a hurry please don't kill me_
     */

    let split = message.content.trim().split(/\s+/);
    let cmd = split[0].substr(1, split[0].length);
    let args = split.splice(1, split.length);
    switch (cmd) {
        //TODO: Replace infractions with a web interface
        case "infractions": {
            //Check permissions
            let member = message.guild.members.get(message.author.id);
            let hasperms = false;
            for (let role of member.roles) {
                if (role[1].name == config.botDevRole) {
                    hasperms = true;
                    break;
                }
            }
            if (!hasperms)
                return;
            if (args.length == 0) {
                message.reply("You did not specify a user id.");
                return;
            }
            DBManager.Infraction
                .find({userid: args[0]})
                .sort({timestamp: -1}).limit(5)
                .then(docs => {
                    if (docs.length == 0) {
                        message.reply("This user has no logged infractions!");
                        return;
                    }
                    let msg = "**Infractions for user _" + message.author.username + " (" + message.author.id + ")_**\n\n```";
                    docs.forEach(d => {
                        msg += JSON.stringify(d, null, 2) + "\n\n";
                    });
                    msg += "```";
                    message.reply(msg);
                })
                .catch(err => {
                    Logging.error("!infractions", err);
                    message.reply("Something went wrong! Please check the logs.");
                });
            return;
        }
    }
};

let combatMuteEvasion = guildMember => {
    //Verify mute state to combat mute evasion
    DBManager.UserRecord.findOne({
        userid: guildMember.user.id
    }, (err, userRecord) => {
        //Process error
        if (err) {
            Logging.error("MUTE_EVASION_COMBAT_FIND", err);
            return;
        }

        //Stop if no record of this user exists yet
        if (!userRecord) return;

        //Check if user should be muted
        if (userRecord.mutedUntil > moment().unix()) {
            //Reapply mute
            DiscordUtils.getRole(guildMember.guild, "Muted").then(role => guildMember.addRole(role));

            //Leave log
            Logging.mod(Logging.format("MUTE EVASION DETECTED", "By user _" + guildMember.user.username + " (" + guildMember.user.id + ")_"));
        }
    });
};
