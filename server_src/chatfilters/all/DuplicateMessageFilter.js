// @flow

import AbstractFilter from '../AbstractFilter';

import {Redis} from '../../utils/DBManager';
import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class BulkMentionFilter extends AbstractFilter {

    constructor() {
        super("Duplicate Message Filter");
    }

    async check(message : Message) : Promise < boolean > {
        //Define key
        let key = message.author.id + ":lastMessage";

        let res = await Redis.existsAsync(key);
        //Create key if it does not exist yet and stop here
        if (!res) {
            Redis.set(key, message.content);
            Redis.expire(key, 20);
            return false;
        }
        //Check if content matches
        res = await Redis.getAsync(key);
        //TODO: Add check that covers slight variations
        return message.content === res;
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
        message.author.sendMessage("Your message was removed: Identical consecutive messages are not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Duplicate Message Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new BulkMentionFilter();
