// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class RepeatedCharacterFilter extends AbstractFilter {

    constructor() {
        super("Repeated Character Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.content.match(/.*([^.\s])\1{6,}.*/gi);
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
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
