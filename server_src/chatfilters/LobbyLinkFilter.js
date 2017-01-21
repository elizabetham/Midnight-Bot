// @flow

import LinkFilter from './LinkFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class LobbyLinkFilter extends LinkFilter {

    constructor() {
        super("Bazza Filter");
    }

    domains() : Array < string > {
        return [""]; //Match any
    }

    async check(message : Message) : Promise < boolean > {
        let channels = [
            "249323706285948928", //Main Guild #lobby_1
            "252543317844295680", //Main Guild #lobby_2
            "257564280725962753" //Test Guild #development
        ];
        return channels.indexOf(message.channel.id) > -1 && await super.check(message);
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting links in the lobby channels is prohibited.");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Lobby Link Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new LobbyLinkFilter();
