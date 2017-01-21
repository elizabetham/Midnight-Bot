// @flow

import {AbstractFilter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class RepeatedCharacterFilter extends AbstractFilter {

    constructor() {
        super("Repeated Character Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.content.match(/.*([^.\s])\1{6,}.*/gi);
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Repeated Character Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new RepeatedCharacterFilter();
