// @flow

import AbstractFilter from '../AbstractFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';
import emojiRegex from 'emoji-regex';

class EmojiSpamFilter extends AbstractFilter {

    constructor() {
        super("Emoji Spam Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let matches = message.content.match(emojiRegex());
        return matches && matches.length >= 9;
    }

    async action(message : Message) : Promise < void > {
        message.delete().catch(e => {});
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Emoji Spam Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new EmojiSpamFilter();
