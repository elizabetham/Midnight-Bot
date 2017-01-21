// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';
import {Redis} from '../DBManager';

class FloodSpamFilter extends Filter {

    constructor() {
        super("Flood Spam Filter");
    }

    async check(message : Message) : Promise < boolean > {
        const MESSAGES = 5; //messages per
        const SECONDS = 6; //period of seconds
        //Define key
        let key = message.author.id + ":floodcount";

        let res = await Redis.existsAsync(key);

        //Create key if it does not exist yet
        if (!res) {
            Redis.set(key, 0);
            Redis.expire(key, SECONDS);
        }
        //Increment message count
        Redis.incr(key);
        res = await Redis.getAsync(key);
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
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("FLOOD_FILTER_ACTION", err);
        }
    }
}

export default new FloodSpamFilter();
