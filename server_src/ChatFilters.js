// @flow
//MODULES
import Logging from './Logging';

//Chat filters
import BazzaFilter from './chatfilters/BazzaFilter';
import BulkMentionFilter from './chatfilters/BulkMentionFilter';
import DiscordInviteFilter from './chatfilters/DiscordInviteFilter';
import DuplicateMessageFilter from './chatfilters/DuplicateMessageFilter';
import EmojiSpamFilter from './chatfilters/EmojiSpamFilter';
import FloodSpamFilter from './chatfilters/FloodSpamFilter';
import LobbyLinkFilter from './chatfilters/LobbyLinkFilter';
import MentionFilter from './chatfilters/LobbyLinkFilter';
import OffensiveBehaviourFilter from './chatfilters/OffensiveBehaviourFilter';
import PornLinkFilter from './chatfilters/PornLinkFilter';
import RacismFilter from './chatfilters/RacismFilter';
import RepeatedCharacterFilter from './chatfilters/RepeatedCharacterFilter';
import ScamLinkFilter from './chatfilters/ScamLinkFilter';

//Types
import {Message} from 'discord.js';

//FILTERS
const filters : Array < Filter > = [
    //Message quantity
    DuplicateMessageFilter,
    FloodSpamFilter,
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
    RacismFilter
];

//Filter class
export class Filter {

    displayName : string;

    constructor(displayName : string) {
        this.displayName = displayName;
        (this : any).check = this.check.bind(this);
        (this : any).action = this.action.bind(this);
    }

    async check(message : Message) : Promise < boolean > {
        Logging.error("Check method not implemented for filter '" + this.displayName + "'");
        return false;
    }

    async action(message : Message) : Promise < void > {
        Logging.error("Action method not implemented for filter '" + this.displayName + "'");
    }

}

//FUNCTIONS
export const processMessage = async(message : Message, takeAction : boolean) => {
    for (let filter : Filter of filters) {
        let applies = await filter.check(message);
        if (applies) {
            if (takeAction) {
                filter.action(message);
            }
            return filter;
        }
    }
    return null;
};
