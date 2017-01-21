// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class ScamLinkFilter extends Filter {

    constructor() {
        super("Scam Link Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let rules = [
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)giftsofsteam\.com.*/gi, //Giftsofsteam scam
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)give-aways\.net.*/gi, //Riot Points scam
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)steamdigitalgift\.com.*/gi //Steam Digital Gift scam
        ];
        return rules.filter(rule => message.content.match(rule)).length > 0;
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting scam links is prohibited.\nIf you did this unknowingly, your login details to whatever site (Steam etc. ) may be compromised. Change them immediately!");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Scam Link Filter",
            triggerMessage: message.content
        });
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(await infraction.save());
    }
}

export default new ScamLinkFilter();
