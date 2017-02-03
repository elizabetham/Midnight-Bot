// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';
import Config from '../../../config';

class MentionFilter extends AbstractFilter {

    prohibitedMentions : Array < string >;

    constructor() {
        super("Mention Filter");
        this.prohibitedMentions = [
            "171550475697651712", // Aardvark
            "142548906570547200", // BazzaGazza
            "183551304319238144", // BlackBluesPlayer
            "201537591823171585", // Muselk
            "201945322279141377", // Neptune
            "189031328811974656", // oasis
            "212121033854025728", // Tyr
            "134460592177020928", // Vikkstar123
            "172535328316325888", // zylbrad
            "156902826738581504", // Stylosa
            "171149131157471232" // tava
        ];
    }

    async check(message : Message) : Promise < boolean > {
        return message.mentions.users.array().filter(u => this.prohibitedMentions.indexOf(u.id) > -1).length > 0;
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
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
