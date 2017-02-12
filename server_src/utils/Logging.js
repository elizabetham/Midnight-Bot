// @flow
//
//Modules
import DiscordUtils from './DiscordUtils';
import TimeUtils from './TimeUtils';
import {InfractionRecord} from './DBManager';

//Config
import Config from '../../config';
import moment from 'moment';

export const bot = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannelByName(guild, Config.botLogChannel);
            channel.sendMessage(msg, {split: true});
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const mod = (msg : string) => {
    DiscordUtils.client.guilds.array().forEach(async(guild) => {
        try {
            let channel = await DiscordUtils.getTextChannelByName(guild, Config.botModChannel);
            channel.sendMessage(msg, {split: true});
        } catch (err) {
            error("MOD_LOG", err);
        }
    });
};

export const format = (prefix : string, text : string, codeblock : boolean = false) => {
    if (codeblock) {
        text = '\n```\n' + text + "\n```\n";
    }
    return "**[" + prefix + "]** " + text;
};

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
let warnTimeData = {};

//TODO: REPLACE LOGGING SOLUTION

export const warning = async(identifier : string, err : any) => {
    //Log error to console
    console.log("WARNING [" + identifier + "]", err);

    //Prevent botlog spam
    if (warnTimeData[identifier] != undefined && moment().unix() - warnTimeData[identifier] < 300)
        return;
    warnTimeData[identifier] = moment().unix();

    //post in client log channel
    console.log(err);
    if (typeof err != "string") {
        err = JSON.stringify(err, null, 2);
    }
    bot(format("WARNING [" + identifier + "]", err, true));
};

export const error = async(identifier : string, err : any) => {
    //Log error to console
    console.error("ERROR [" + identifier + "]", err);

    //Prevent botlog spam
    if (errorTimeData[identifier] != undefined && moment().unix() - errorTimeData[identifier] < 300)
        return;
    errorTimeData[identifier] = moment().unix();

    //post in client log channel
    console.error(err);
    if (typeof err != "string") {
        err = JSON.stringify(err, null, 2);
    }
    bot(format("ERROR [" + identifier + "]", err, true));
};

export default {
    bot,
    mod,
    format,
    infractionLog,
    error,
    warning
};
