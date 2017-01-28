// @flow

import {Role, GuildMember, Message} from 'discord.js';
import _ from 'lodash';

export default {
    extractUID : (argument : string) :
        ? string => {
            return argument.match(/^<@[0-9]*>$/)
                ? argument.substring(2, argument.length - 1)
                : (argument.match(/^[0-9]*$/)
                    ? argument
                    : null);
        },
    hasPermission : (user : GuildMember, minRole : Role, inclusive : boolean = true) : boolean => {
        const userpos = _.max(user.roles.array().map(r => r.position));

        return user.roles.array().find(role => role.name.toUpperCase() == "BOTDEV" || (inclusive && userpos >= minRole.position || userpos > minRole.position));
    },
    parseTime : (time : string) :
        ? number => {
            //EXPECT "[value] [unit]";
            if (!time.match(/^[0-9]{0,10}\s+(second|minute|hour|day|week|month)s?$/))
                return null;

            const units = {
                second: 1,
                minute: 60,
                hour: 3600,
                day: 3600 * 24,
                week: 3600 * 24 * 7,
                month: 3600 * 24 * 30
            }

            const split : Array < string > = time.trim().split(/\s+/gi);

            const value : number = Number(split[0]);
            const unit : string = split[1].substring(split[1].length - 1, split[1].length) == 's'
                ? split[1].substring(0, split[1].length - 1)
                : split[1];

            return units[unit] * value;
        },
    volatileReply : async(reply : (message : string) => Message, message : string, delay : number, originalMsg :? Message) => {
        const msg = await reply(message);
        setTimeout(() => {
            msg.delete();
            if (originalMsg)
                originalMsg.delete();
            }
        , delay);
    }
}
