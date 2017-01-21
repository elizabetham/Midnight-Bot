// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class LobbyLinkFilter extends Filter {

    constructor() {
        super("Bazza Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let channels = [
            "249323706285948928", //Main Guild #lobby_1
            "252543317844295680", //Main Guild #lobby_2
            "257564280725962753" //Test Guild #development
        ];
        let filters = [/.*https{0,1}:\/\/.*/gi, /.*www[0-9]*\.[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}.*/gi];
        return channels.indexOf(message.channel.id) > -1 && filters.filter(regex => message.content.match(regex)).length > 0;
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
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(await infraction.save());
    }
}

export default new LobbyLinkFilter();
