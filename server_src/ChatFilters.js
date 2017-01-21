// @flow
//MODULES
import Logging from './Logging';

import AbstractFilter from './chatfilters/AbstractFilter'

//Chat filters
import BazzaFilter from './chatfilters/BazzaFilter';
import BulkMentionFilter from './chatfilters/BulkMentionFilter';
import DiscordInviteFilter from './chatfilters/DiscordInviteFilter';
import DuplicateMessageFilter from './chatfilters/DuplicateMessageFilter';
import EmojiSpamFilter from './chatfilters/EmojiSpamFilter';
import FloodSpamFilter from './chatfilters/FloodSpamFilter';
import LobbyLinkFilter from './chatfilters/LobbyLinkFilter';
import MentionFilter from './chatfilters/MentionFilter';
import OffensiveBehaviourFilter from './chatfilters/OffensiveBehaviourFilter';
import PornLinkFilter from './chatfilters/PornLinkFilter';
import RacismFilter from './chatfilters/RacismFilter';
import RepeatedCharacterFilter from './chatfilters/RepeatedCharacterFilter';
import ScamLinkFilter from './chatfilters/ScamLinkFilter';

//Types
import {Message} from 'discord.js';

//FILTERS
const filters : Array < AbstractFilter > = [
    //Mentions
    MentionFilter,
    BulkMentionFilter,
    //Content spam
    BazzaFilter,
    RepeatedCharacterFilter,
    EmojiSpamFilter,
    //Link spam
    PornLinkFilter,
    ScamLinkFilter,
    LobbyLinkFilter,
    DiscordInviteFilter,
    //Toxicity
    OffensiveBehaviourFilter,
    RacismFilter,
    //Message quantity
    DuplicateMessageFilter,
    FloodSpamFilter
];

//FUNCTIONS
export const processMessage = async(message : Message, takeAction : boolean) => {
    for (let filter of filters) {
        let applies = await filter.check(message);
        if (!applies) {
            continue;
        }
        if (takeAction) {
            await filter.action(message);
        }
        return filter;
    }
    return null;
};
