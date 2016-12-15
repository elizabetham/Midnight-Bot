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
    setTimeout(() => {
        DiscordUtils.client.user.setAvatar("./app/res/img/avatar.png");
    }, 1000);
});

//Handle member joining
DiscordUtils.client.on('guildMemberAdd', guildMember => {
    combatMuteEvasion(guildMember)
});

//Handle message receive event
DiscordUtils.client.on('message', message => {
        //Prevent bot from using itself
        if (message.author.bot) return;
        //Disable PM
        if (!message.guild) return;

        //Command detection
        if (message.content.startsWith("!")) {
            processCommand(message);
            return;
        }

        //Check if user is on role whitelist
        if (message.member && message.member.roles.array().filter(r => config.whitelistedRoles.indexOf(r.id) > -1).length == 0) ChatFilters.process(message);
    }
);

let processCommand = message => {
    //TODO: Implement command framework
    // let split = message.content.trim().split(/\s+/);
    // let cmd = split[0].substr(1, split[0].length);
    // let args = split.splice(1, split.length);
    // switch (cmd) {
    // }
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
