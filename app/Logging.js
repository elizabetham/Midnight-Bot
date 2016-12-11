//Modules
const DiscordUtils = require("./DiscordUtils.js");
const Logging = require("./Logging.js");
const TimeUtils = require("./TimeUtils.js");

//Config
const config = require("../config.js");

//Dependencies
const pastebin = new (require('pastebin-js'))(config.PASTEBIN_DEV_KEY);

module.exports.bot = msg => {
    DiscordUtils.client.guilds.array().forEach(guild => {
        DiscordUtils.getTextChannel(guild, config.botLogChannel).then(channel => {
            channel.sendMessage(msg);
        }).catch(err => {
            Logging.error("MOD_LOG", err);
        });
    });
};

module.exports.mod = msg => {
    DiscordUtils.client.guilds.array().forEach(guild => {
        DiscordUtils.getTextChannel(guild, config.botModChannel).then(channel => {
            channel.sendMessage(msg);
        }).catch(err => {
            Logging.error("MOD_LOG", err);
        });
    });
};

module.exports.format = (prefix, text) => "**[" + prefix + "]** " + text;

module.exports.infractionLog = infraction => {
    let msg = "";
    switch (infraction.action.type) {
        case "MUTE":
            msg = "_(" + ((infraction.action.meta == Number.MAX_SAFE_INTEGER) ? "Permanent" : TimeUtils.readableInterval(infraction.action.meta)) + ")_ ";
            break;
    }
    DiscordUtils.client.fetchUser(infraction.userid).then(user => {
        msg += "User _" + user.username + " (" + infraction.userid + ")_ has received an infraction.";
        if (infraction.filter)
            msg += "\nFilter: " + infraction.filter.displayName;
        //TODO: Add link url to infraction information here
        this.mod(this.format(infraction.action.type, msg));
    }).catch(err => {
        if (err) this.error("INFRACTION_LOG", err);
    });
};

module.exports.error = (identifier, err) => {
    //Log error to console
    console.log("[" + identifier + "]", err);

    //Create pastebin & post in client log channel
    let self = this;
    pastebin.createPaste({
        text: JSON.stringify(err, null, 2),
        privacy: 1,
        title: "[" + config.botName + "] Error (ID: " + identifier + ")"
    })
        .then(function (data) {
            self.bot(self.format("ERROR", "[" + identifier + "]: <http://pastebin.com/" + data + ">"));
        })
        .catch(function (err) {
            console.log(err);
            self.bot(self.format("ERROR", "[" + identifier + "]: Could not upload to pastebin."));
        });
};