// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class OffensiveBehaviour extends AbstractFilter {

    constructor() {
        super("Offensive Behaviour Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let rules = [ //Potentially expand this later
            /.*\bk+y+s+\b.*/gi //kys
        ];
        return rules.filter(rule => message.content.match(rule)).length > 0;
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
        message.author.sendMessage("Your message was removed: Offensive behavior towards other members is not permitted here.");

        //Punish
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Offensive Behavior Filter",
                triggerMessage: message.content
            });
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("OFFENSIVE_FILTER_ACTION", err);
        }
    }
}

export default new OffensiveBehaviour();
