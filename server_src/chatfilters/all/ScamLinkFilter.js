// @flow

import AbstractLinkFilter from '../AbstractLinkFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class ScamLinkFilter extends AbstractLinkFilter {

    constructor() {
        super("Scam Link Filter");
    }

    domains() : Array < string > {
        return [
            "giftsofsteam.com", //Giftsofsteam scam
            "give-aways.net", //Riot Points scam
            "steamdigitalgift.com", //Steam Digital Gift scam
            "lolfreerpcodes.com" //LoL Free RP codes scam
        ];
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
        message.author.sendMessage("Your message was removed: Posting scam links is prohibited.\nIf you did this unknowingly, your login details to whatever site (Steam etc. ) may be compromised. Change them immediately!");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Scam Link Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new ScamLinkFilter();
