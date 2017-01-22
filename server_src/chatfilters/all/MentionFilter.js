// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';
import Config from '../../../config';

class MentionFilter extends AbstractFilter {

    constructor() {
        super("Mention Filter");
    }

    async check(message : Message) : Promise < boolean > {
        return message.mentions.users.array().filter(u => Config.prohibitedMentions.indexOf(u.id) > -1).length > 0;
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not permitted to mention members of the Grandmaster Gang directly."); //Grammar fix, not from but of

        //Punish
        try {
            let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                displayName: "Mention Filter",
                triggerMessage: message.content
            });
            Logging.infractionLog(await infraction.save());
        } catch (err) {
            Logging.error("MENTION_FILTER_ACTION", err);
        }
    }
}

export default new MentionFilter();
