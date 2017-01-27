// @flow

//Modules
import DiscordUtils from './utils/DiscordUtils';
import {UserRecord, InfractionRecord, Redis} from './utils/DBManager';
import Logging from './utils/Logging';
import {processMessage} from './chatfilters/ChatFilters';
import CommandDispatcher from './command/Dispatcher';

//Config
import Config from '../config';

//Dependencies
import moment from 'moment';
import pastebinJs from 'pastebin-js'
const pastebin = new pastebinJs(Config.PASTEBIN_DEV_KEY);

//Types
import {GuildMember, Message} from 'discord.js';

//Files
const avatar = require("./res/img/avatar.png");

//Notify when ready for use
DiscordUtils.client.on('ready', async() => {
    console.log('Discord connection ready.');
    //Set the avatar and game of the bot
    setTimeout(async() => {
        DiscordUtils.client.user.setAvatar(avatar);

        const cachedGame : string = await DiscordUtils.getPlaying();
        if (cachedGame) {
            DiscordUtils.setPlaying(cachedGame);
        } else if (Config.hasOwnProperty("playing"))
            DiscordUtils.setPlaying(Config.playing, false);
        }
    , 1000);
});

//Handle member joining
DiscordUtils.client.on('guildMemberAdd', guildMember => {
    combatMuteEvasion(guildMember);
});

//Handle message receive event
DiscordUtils.client.on('message', (message : Message) => {

    //Prevent bot from using itself
    if (message.author.bot)
        return;

    //Disable PM
    if (!message.guild)
        return;

    if (message.content.match(new RegExp("^<@" + DiscordUtils.client.user.id + ">", "gi")) || message.content.substring(0, 1) == "!") {
        if (CommandDispatcher.processMessage(message))
            return;
        }

    //Check if user is on role whitelist
    if (message.member && message.member.roles.array().filter(r => Config.whitelistedRoles.indexOf(r.id) > -1).length == 0)
        processMessage(message, true);
    }
);

let combatMuteEvasion = async(guildMember : GuildMember) => {
    //Verify mute state to combat mute evasion
    try {
        let userRecord = await UserRecord.findOne({userid: guildMember.user.id});

        //Stop if no record of this user exists yet
        if (!userRecord)
            return;

        //Check if user should be muted
        if (userRecord.mutedUntil > moment().unix()) {
            //Reapply mute
            try {
                let role = await DiscordUtils.getRole(guildMember.guild, "Muted");
                guildMember.addRole(role);
            } catch (err) {
                Logging.error("MUTE_EVASION_REAPPLICATION", err)
            }

            //Leave log
            Logging.mod(Logging.format("MUTE EVASION DETECTED", "By user **" + guildMember.user.username + "** (**" + guildMember.user.id + ")**"));
        }
    } catch (err) {
        Logging.error("MUTE_EVASION_COMBAT_FIND", err);
    }

};
