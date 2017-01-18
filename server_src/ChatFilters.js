// @flow
//MODULES
import UserUtils from './UserUtils';
import Logging from './Logging';
import Infraction from './Infraction';
import {UserRecord, InfractionRecord, Redis} from './DBManager';

//Config
import Config from '../config';

//DEPENDENCIES
import moment from 'moment';
import emojiRegex from 'emoji-regex';

//Types
import {Message} from 'discord.js';

//Filter class
interface Filter {

    displayName : string;
    check(message : Message) : Promise < boolean >;
    action(message : Message) : Promise < void >;

}

//FILTERS
let filters : Array < Filter > = [
    {
        displayName: "Mention Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                resolve(message.mentions.users.array().filter(u => Config.prohibitedMentions.indexOf(u.username) > -1).length > 0);
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: It is not permitted to mention members of the Grandmaster Gang directly."); //Grammar fix, not from but of

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Mention Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("MENTION_FILTER_ACTION", err);
            }
        }
    }, {
        displayName: "Repeated Character Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                resolve(message.content.match(/.*([^.\s])\1{6,}.*/gi));
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");
            let infraction = new Infraction(message.author.id, moment().unix(), {
                type: 'WARN',
                increasedNotoriety: false
            }, {
                displayName: "Repeated Character Filter",
                triggerMessage: message.content
            });
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }, {
        displayName: "Bazza Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                resolve(message.content.match(/.*b+a+z+a{4,}.*/gi));
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

            //Punish
            let infraction = new Infraction(message.author.id, moment().unix(), {
                type: 'WARN',
                increasedNotoriety: false
            }, {
                displayName: "Bazza Filter",
                triggerMessage: message.content
            });
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }, {
        displayName: "Emoji Spam Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                let matches = message.content.match(emojiRegex());
                resolve(matches && matches.length >= 10);
            });
        },
        action: async(message : Message) => {
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
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }, {
        displayName: "Bulk Mention Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                resolve(message.content.match(/.*@{5,}.*/gi));
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Mass mentioning people is not permitted.");

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Bulk Mention Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("BULK_MENTION_FILTER_ACTION", err);
            }
        }
    }, {
        displayName: "Discord Invite Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                resolve(message.content.match(/.*discord\.gg\/.*/gi));
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: It is not allowed to advertise other Discord servers in our guild.");

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Discord Invite Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("DISCORD_INVITE_FITLER_ACTION", err);
            }
        }
    }, {
        displayName: "Racism Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                let rules = [
                    /.*\bn+(i|1|e|3)+(g|6)+(r+(0|o)+|(a|4)+|(e|3)+r*|u+)h*s*\b.*/gi, //nigger
                    /.*\bj+(e|3)+w+s*\b.*/gi, //jew
                    /.*\bf+(4|a)*g+(e|3|o|0)*t*s*\b.*/gi //fag
                ];
                resolve(rules.filter(rule => message.content.match(rule)).length > 0)
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: The use of racist or discriminative terms is not permitted here.");

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Racism Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("RACISM_FILTER_ACTION", err);
            }
        }
    }, {
        displayName: "Offensive Behavior Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                let rules = [ //Potentially expand this later
                    /.*\bk+y+s\b.*/gi //kys
                ];
                resolve(rules.filter(rule => message.content.match(rule)).length > 0)
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Offensive behavior towards other members is not permitted here.");

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Offensive Behavior Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("OFFENSIVE_FILTER_ACTION", err);
            }
        }
    }, {
        displayName: "Lobby Link Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                let channels = [
                    "249323706285948928", //Main Guild #lobby_1
                    "252543317844295680", //Main Guild #lobby_2
                    "257564280725962753" //Test Guild #development
                ];
                let filters = [/.*https{0,1}:\/\/.*/gi, /.*www[0-9]*\.[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}.*/gi];
                resolve(channels.indexOf(message.channel.id) > -1 && filters.filter(regex => message.content.match(regex)).length > 0);
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Posting links in the lobby channels is prohibited.");
            let infraction = new Infraction(message.author.id, moment().unix(), {
                type: 'WARN',
                increasedNotoriety: false
            }, {
                displayName: "Lobby Link Filter",
                triggerMessage: message.content
            });
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }, {
        displayName: "Scam Link Filter",
        check: (message : Message) => {
            return new Promise(resolve => {
                let rules = [
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)giftsofsteam\.com.*/gi, //Giftsofsteam scam
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)give-aways\.net.*/gi, //Riot Points scam
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)steamdigitalgift\.com.*/gi //Steam Digital Gift scam
                ];
                resolve(rules.filter(rule => message.content.match(rule)).length > 0)
            });
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Posting scam links is prohibited.\nIf you did this unknowingly, your login details to whatever site (Steam etc. ) may be compromised. Change them immediately!");
            let infraction = new Infraction(message.author.id, moment().unix(), {
                type: 'WARN',
                increasedNotoriety: false
            }, {
                displayName: "Scam Link Filter",
                triggerMessage: message.content
            });
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }, {
        displayName: "Flood-Spam Filter",
        check: async(message : Message) => {
            const MESSAGES = 5; //messages per
            const SECONDS = 6; //period of seconds
            //Define key
            let key = message.author.id + ":floodcount";

            let res = await Redis.existsAsync(key);

            //Create key if it does not exist yet
            if (!res) {
                Redis.set(key, 0);
                Redis.expire(key, SECONDS);
            }
            //Increment message count
            Redis.incr(key);
            res = await Redis.getAsync(key);
            return res > MESSAGES;
        },
        action: async(message : Message) => {
            message.author.sendMessage("Your messages were removed: Rapid message spam is not permitted.");

            //Reset floodcount & remove messages
            let key = message.author.id + ":floodcount";
            const msgCount = await Redis.getAsync(key);
            let res = await message.channel.fetchMessages({limit: 40});
            res.array().filter(msg => msg.author.id == message.author.id).sort((a, b) => b - a).slice(0, msgCount).forEach(msg => msg.delete());

            Redis.del(key);

            //Punish
            try {
                let infractionAction = await UserUtils.increaseNotoriety(message.author.id);
                let infraction = new Infraction(message.author.id, moment().unix(), infractionAction, {
                    displayName: "Flood-Spam Filter",
                    triggerMessage: "MULTIPLE MESSAGES"
                });
                infraction.save();
                UserUtils.assertUserRecord(message.author.id);
                Logging.infractionLog(infraction);
            } catch (err) {
                Logging.error("FLOOD_FILTER_ACTION", err);
            }
        }
    }, {
        displayName: "Duplicate Message Filter",
        check: async(message) => {
            //Define key
            let key = message.author.id + ":lastMessage";

            let res = await Redis.existsAsync(key);
            //Create key if it does not exist yet and stop here
            if (!res) {
                Redis.set(key, message.content);
                Redis.expire(key, 20);
                return false;
            }
            //Check if content matches
            res = await Redis.getAsync(key);
            //TODO: Add check that covers slight variations
            return message.content === res;
        },
        action: async(message : Message) => {
            message.delete();
            message.author.sendMessage("Your message was removed: Identical consecutive messages are not permitted.");
            let infraction = new Infraction(message.author.id, moment().unix(), {
                type: 'WARN',
                increasedNotoriety: false
            }, {
                displayName: "Duplicate Message Filter",
                triggerMessage: message.content
            });
            infraction.save();
            UserUtils.assertUserRecord(message.author.id);
            Logging.infractionLog(infraction);
        }
    }
];

//FUNCTIONS
export const process = async function(message : Message, takeAction : boolean) {
    for (let filter of filters) {
        let applies = await filter.check(message);
        if (applies) {
            if (takeAction)
                filter.action(message);
            return filter;
        }
    }
    return null;
};

export default {
    process
};
