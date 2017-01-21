// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class DiscordInviteFilter extends Filter {

    constructor() {
        super("Discord Invite Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.content.match(/.*discord\.gg\/.*/gi);
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not allowed to advertise other Discord servers in our guild.");

        //Punish
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Discord Invite Filter",
                triggerMessage: message.content
            });
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("DISCORD_INVITE_FITLER_ACTION", err);
        }
    }
}

export default new DiscordInviteFilter();
