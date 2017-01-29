// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';
import {Redis} from '../../utils/DBManager';

class FloodSpamFilter extends AbstractFilter {

    constructor() {
        super("Flood Spam Filter");
    }

    async check(message : Message) : Promise < boolean > {
        const MESSAGES = 5; //messages per
        const SECONDS = 6; //period of seconds
        //Define key
        let key = message.author.id + ":floodcount";
        //Increment message count
        let res = await Redis.incrAsync(key);
        return res > MESSAGES;
    }

    async action(message : Message) : Promise < void > {
        message.author.sendMessage("Your messages were removed: Rapid message spam is not permitted.");

        //Reset floodcount & remove messages
        let key = message.author.id + ":floodcount";
        const msgCount = await Redis.getAsync(key);
        let res = await message.channel.fetchMessages({limit: 40});
        res.array().filter(msg => msg.author.id == message.author.id).sort((a, b) => b - a).slice(0, msgCount).forEach(msg => msg.delete());

        Redis.del(key);

        //Punish
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Flood-Spam Filter",
                triggerMessage: "MULTIPLE MESSAGES"
            });
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("FLOOD_FILTER_ACTION", err);
        }
    }
}

export default new FloodSpamFilter();
