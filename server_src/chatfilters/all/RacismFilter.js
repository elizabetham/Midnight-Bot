// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class RacismFilter extends AbstractFilter {

    constructor() {
        super("Racism Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let rules = [
            /.*\bn+(i|1|e|3)+(g|6)+(r+(0|o)+|(a|4)+|(e|3)+r*|u+)h*s*\b.*/gi, //nigger
            /.*\bj+(e|3)+w+s*\b.*/gi, //jew
            /.*\bf+(4|a)*(g|6)+(e|3|o|0)*t*s*\b.*/gi //fag
        ];
        return rules.filter(rule => message.content.match(rule)).length > 0;
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
        message.author.sendMessage("Your message was removed: The use of racist or discriminative terms is not permitted here.");

        //Punish
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Racism Filter",
                triggerMessage: message.content
            });
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("RACISM_FILTER_ACTION", err);
        }
    }
}

export default new RacismFilter();
