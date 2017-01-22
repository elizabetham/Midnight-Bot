// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class BulkMentionFilter extends AbstractFilter {

    constructor() {
        super("Bulk Mention Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.content.match(/(.*@.*){5,}/gi);
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Mass mentioning people is not permitted.");
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Bulk Mention Filter",
                triggerMessage: message.content
            });
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("BULK_MENTION_FILTER_ACTION", err);
        }
    }
}

export default new BulkMentionFilter();
