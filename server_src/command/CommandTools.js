// @ flow
import {Role, GuildMember} from 'discord.js';
import _ from 'lodash';

export default {
    extractUID : (argument : string) :
        ? string => {
            return argument.match(/^<@[0-9]*>$/)
                ? argument.substring(2, argument.length - 1)
                : null;
        },
    hasPermission : (user : GuildMember, minRole : Role, inclusive : boolean = true) : boolean => {
        const userpos = _.max(user.roles.array().map(r => r.position));

        return user.roles.array().find(role => role.name.toUpperCase() == "BOTDEV") || (inclusive && userpos >= minRole.position || userpos > minRole.position) ();
    }
}
