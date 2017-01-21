// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';
import emojiRegex from 'emoji-regex';

class EmojiSpamFilter extends Filter {

    constructor() {
        super("Emoji Spam Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let matches = message.content.match(emojiRegex());
        return matches && matches.length >= 9;
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: false
        }, {
            displayName: "Emoji Spam Filter",
            triggerMessage: message.content
        });
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(await infraction.save());
    }
}

export default new EmojiSpamFilter();
