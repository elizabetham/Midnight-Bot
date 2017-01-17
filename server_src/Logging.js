// @flow
//
//Modules
import DiscordUtils from './DiscordUtils';
import TimeUtils from './TimeUtils';
import {InfractionRecord} from './DBManager';

//Config
import Config from '../config';

//Dependencies
const pastebin = new(require('pastebin-js'))(Config.PASTEBIN_DEV_KEY);

export const bot = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannel(guild, Config.botLogChannel);
            channel.sendMessage(msg);
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const mod = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannel(guild, Config.botModChannel);
            channel.sendMessage(msg);
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const format = (prefix : string, text : string) => "**[" + prefix + "]** " + text;

export const infractionLog = async(infraction : InfractionRecord) => {
    let msg = "";
    switch (infraction.action.type) {
        case "MUTE":
            msg = "(**" + ((infraction.action.meta == Number.MAX_SAFE_INTEGER)
                ? "Permanent"
                : TimeUtils.readableInterval(infraction.action.meta)) + "**) ";
            break;
    }
    try {
        let user = await DiscordUtils.client.fetchUser(infraction.userid);
        msg += "User **" + user.username + "** (**" + infraction.userid + "**) has received an infraction.";
        if (infraction.filter)
            msg += "\nFilter: " + infraction.filter.displayName;

        //TODO: Add link url to infraction information here
        mod(format(infraction.action.type, msg));
    } catch (err) {
        if (err)
            error("INFRACTION_LOG", err);
        }
    };

export const error = async(identifier : string, err : any) => {
    //Log error to console
    console.error("[" + identifier + "]", err);

    //Create pastebin & post in client log channel
    try {
        let data = await pastebin.createPaste({
            text: JSON.stringify(err, null, 2),
            privacy: 1,
            title: "[Midnight] Error (ID: " + identifier + ")"
        });
        bot(format("ERROR", "[" + identifier + "]: <http://pastebin.com/" + data + ">"));
    } catch (err) {
        console.error(err);
        bot(format("ERROR", "[" + identifier + "]: Could not upload to pastebin."));
    }
};

export default {
    bot,
    mod,
    format,
    infractionLog,
    error
};
