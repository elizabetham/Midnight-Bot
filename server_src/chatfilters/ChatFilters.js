// @flow
//MODULES
import Logging from '../utils/Logging';

import AbstractFilter from './AbstractFilter'

//Chat filters
import BazzaFilter from './all/BazzaFilter';
import BulkMentionFilter from './all/BulkMentionFilter';
import DiscordInviteFilter from './all/DiscordInviteFilter';
import DuplicateMessageFilter from './all/DuplicateMessageFilter';
import EmojiSpamFilter from './all/EmojiSpamFilter';
import FloodSpamFilter from './all/FloodSpamFilter';
import LobbyLinkFilter from './all/LobbyLinkFilter';
import MentionFilter from './all/MentionFilter';
import OffensiveBehaviourFilter from './all/OffensiveBehaviourFilter';
import PornLinkFilter from './all/PornLinkFilter';
import RacismFilter from './all/RacismFilter';
import RepeatedCharacterFilter from './all/RepeatedCharacterFilter';
import ScamLinkFilter from './all/ScamLinkFilter';

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
