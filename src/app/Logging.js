//Modules
const DiscordUtils = require("./DiscordUtils.js");
const Logging = require("./Logging.js");
const TimeUtils = require("./TimeUtils.js");

//Config
const config = require("../config.js");

//Dependencies
const pastebin = new (require('pastebin-js'))(config.PASTEBIN_DEV_KEY);

module.exports.bot = msg => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannel(guild, config.botLogChannel);
            channel.sendMessage(msg);
        } catch (err) {
            Logging.error("MOD_LOG", err);
        }
    });
};

module.exports.mod = msg => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannel(guild, config.botModChannel);
            channel.sendMessage(msg);
        } catch (err) {
            Logging.error("MOD_LOG", err);
        }
    });
};

module.exports.format = (prefix, text) => "**[" + prefix + "]** " + text;

module.exports.infractionLog = async(infraction) => {
    let msg = "";
    switch (infraction.action.type) {
        case "MUTE":
            msg = "(**" + ((infraction.action.meta == Number.MAX_SAFE_INTEGER) ? "Permanent" : TimeUtils.readableInterval(infraction.action.meta)) + "**) ";
            break;
    }
    try {
        let user = DiscordUtils.client.fetchUser(infraction.userid);
        msg += "User **" + user.username + "** (**" + infraction.userid + "**) has received an infraction.";
        if (infraction.filter)
            msg += "\nFilter: " + infraction.filter.displayName;
        //TODO: Add link url to infraction information here
        this.mod(this.format(infraction.action.type, msg));
    } catch (err) {
        if (err) this.error("INFRACTION_LOG", err);
    }
};

module.exports.error = async(identifier, err) => {
    //Log error to console
    console.log("[" + identifier + "]", err);

    //Create pastebin & post in client log channel
    let self = this;
    try {
        let data = await pastebin.createPaste({
            text: JSON.stringify(err, null, 2),
            privacy: 1,
            title: "[Midnight] Error (ID: " + identifier + ")"
        });
        self.bot(self.format("ERROR", "[" + identifier + "]: <http://pastebin.com/" + data + ">"));
    } catch (err) {
        console.log(err);
        self.bot(self.format("ERROR", "[" + identifier + "]: Could not upload to pastebin."));
    }
};
