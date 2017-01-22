// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class BazzaFilter extends AbstractFilter {

    constructor() {
        super("Bazza Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.content.match(/.*b+a+z+a{4,}.*/gi);
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Bazza Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new BazzaFilter();
