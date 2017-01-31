// @flow
//
//Modules
import DiscordUtils from './DiscordUtils';
import TimeUtils from './TimeUtils';
import {InfractionRecord} from './DBManager';

//Config
import Config from '../../config';
import moment from 'moment';

//Dependencies
const pastebin = (Config.PASTEBIN_DEV_KEY)
    ? new(require('pastebin-js'))(Config.PASTEBIN_DEV_KEY)
    : null;

export const bot = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannelByName(guild, Config.botLogChannel);
            channel.sendMessage(msg);
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const mod = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannelByName(guild, Config.botModChannel);
            channel.sendMessage(msg);
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const format = (prefix : string, text : string) => "**[" + prefix + "]** " + text;

export const infractionLog = async(infraction :
    ? InfractionRecord) => {
    if (!infraction)
        return;

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
        let permalink = Config.baseURL + "/#/infractions/" + infraction.userid + "/" + infraction._id;
        msg += "User **" + user.username + "** (**" + infraction.userid + "**) has received an infraction: " + permalink;
        if (infraction.filter)
            msg += "\nFilter: " + infraction.filter.displayName;
        if (infraction.manual) {
            let executor = await DiscordUtils.client.fetchUser(infraction.manual.executor);
            msg += "\nIssued by **" + executor.username + "**";
            if (infraction.manual.reason) {
                msg += " for reason: **" + infraction.manual.reason + "**";
            }
        }
        mod(format(infraction.action.type, msg));
    } catch (err) {
        if (err)
            error("INFRACTION_LOG", err);
        }
    };

let errorTimeData = {};

export const error = async(identifier : string, err : any) => {
    //Log error to console
    console.error("[" + identifier + "]", err);

    //Prevent botlog spam
    if (errorTimeData[identifier] != undefined && moment().unix() - errorTimeData[identifier] < 300)
        return;
    errorTimeData[identifier] = moment().unix();

    //Create pastebin & post in client log channel
    if (pastebin) {
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
    }
};

export default {
    bot,
    mod,
    format,
    infractionLog,
    error
};
