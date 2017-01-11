//MODULES
const UserUtils = require("./UserUtils.js");
const Logging = require("./Logging.js");
const Infraction = require("./Infraction.js");
const DBManager = require("./DBManager.js");

//Config
const config = require("../config.js");

//DEPENDENCIES
const moment = require("moment");
const emojiRegex = require("emoji-regex");

//FUNCTIONS
module.exports.process = async function (message, takeAction) {
    for (let filter in filters) {
        if (!filters.hasOwnProperty(filter)) continue;
        let applies = await filters[filter].check(message);
        if (applies) {
            if (takeAction) filters[filter].action(message);
            return filter;
        }
    }
    return null;
};

//FILTERS
let filters = {};
filters.mentionFilter = {
    displayName: "Mention Filter",
    check: (message) => {
        return new Promise(resolve => {
            resolve(message.mentions.users
                    .array()
                    .filter(u => config.prohibitedMentions.indexOf(u.username) > -1)
                    .length > 0);
        });
    },
    action: async(message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not permitted to mention members of the Grandmaster Gang directly."); //Grammar fix, not from but of

        //Punish
        try {
            let actionData = await  UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Mention Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("MENTION_FILTER_ACTION", err);
        }
    }
};

filters.repeatedCharFilter = {
    displayName: "Repeated Character Filter",
    check: message => {
        return new Promise(resolve => {
            resolve(message.content.match(/.*([^.\s])\1{6,}.*/gi));
        });
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Repeated Character Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};

filters.bazzaFilter = {
    displayName: "Bazza Filter",
    check: message => {
        return new Promise(resolve => {
            resolve(message.content.match(/.*b+a+z+a{4,}.*/gi));
        });
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Bazza Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};

filters.emojiSpamFilter = {
    displayName: "Emoji Spam Filter",
    check: message => {
        return new Promise(resolve => {
            let matches = message.content.match(emojiRegex());
            resolve(matches && matches.length >= 10);
        });
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Emoji Spam Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};

filters.bulkMentionFilter = {
    displayName: "Bulk Mention Filter",
    check: message => {
        return new Promise(resolve => {
            resolve(message.content.match(/.*@{5,}.*/gi));
        });
    },
    action: async(message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: Mass mentioning people is not permitted.");

        //Punish
        try {
            let actionData = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Bulk Mention Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("BULK_MENTION_FILTER_ACTION", err);
        }
    }
};

filters.discordInviteFilter = {
    displayName: "Discord Invite Filter",
    check: message => {
        return new Promise(resolve => {
            resolve(message.content.match(/.*discord\.gg\/.*/gi));
        });
    },
    action: async(message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not allowed to advertise other Discord servers in our guild.");

        //Punish
        try {
            let actionData = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Discord Invite Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("DISCORD_INVITE_FITLER_ACTION", err);
        }
    }
};

filters.racismFilter = {
    displayName: "Racism Filter",
    check: message => {
        return new Promise(resolve => {
            let rules = [
                /.*\bn+(i|1)+(g|6)+((a|4)+|(e|3)+r*|u+)h*s*\b.*/gi, //nigger
                /.*\bj+(e|3)+w+s*\b.*/gi, //jew
                /.*\bf+(4|a)*g+(e|3|o|0)*t*s*\b.*/gi //fag
            ];
            resolve(rules.filter(rule => message.content.match(rule)).length > 0)
        });
    },
    action: async(message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: The use of racist or discriminative terms is not permitted here.");

        //Punish
        try {
            let actionData = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Racism Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("RACISM_FILTER_ACTION", err);
        }
    }
};

filters.offensiveFilter = {
    displayName: "Offensive Behavior Filter",
    check: message => {
        return new Promise(resolve => {
            let rules = [   //Potentially expand this later
                /.*\bk+y+s\b.*/gi //kys
            ];
            resolve(rules.filter(rule => message.content.match(rule)).length > 0)
        });
    },
    action: async(message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: Offensive behavior towards other members is not permitted here.");

        //Punish
        try {
            let actionData = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Offensive Behavior Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("OFFENSIVE_FILTER_ACTION", err);
        }
    }
};

filters.linkFilter = {
    displayName: "Lobby Link Filter",
    check: message => {
        return new Promise(resolve => {
                let channels = [
                    "249323706285948928", //Main Guild #lobby_1
                    "252543317844295680", //Main Guild #lobby_2
                    "257564280725962753" //Test Guild #development
                ];
                let filters = [
                    /.*https{0,1}:\/\/.*/gi,
                    /.*www[0-9]*\.[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}.*/gi
                ];
                resolve(channels.indexOf(message.channel.id) > -1 && filters.filter(regex => message.content.match(regex)).length > 0);
            }
        );
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting links in the lobby channels is prohibited.");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Lobby Link Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};

filters.scamLinkFilter = {
    displayName: "Scam Link Filter",
    check: message => {
        return new Promise(resolve => {
                let rules = [
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)giftsofsteam\.com.*/gi, //Giftsofsteam scam
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)give-aways\.net.*/gi, //Riot Points scam
                    /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)steamdigitalgift\.com.*/gi //Steam Digital Gift scam
                ];
                resolve(rules.filter(rule => message.content.match(rule)).length > 0)
            }
        );
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting scam links is prohibited.\nIf you did this unknowingly, your login details to whatever site (Steam etc. ) may be compromised. Change them immediately!");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Scam Link Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};

filters.floodFilter = {
    displayName: "Flood-Spam Filter",
    check: async(message) => {
        const MESSAGES = 5; //messages per
        const SECONDS = 10; //period of seconds
        //Define key
        let key = message.author.id + ":floodcount";

        let res = await DBManager.redis.existsAsync(key);

        //Create key if it does not exist yet
        if (!res) {
            DBManager.redis.set(key, 0);
            DBManager.redis.expire(key, SECONDS);
        }
        //Increment message count
        DBManager.redis.incr(key);
        res = await DBManager.redis.getAsync(key);
        return res > MESSAGES;
    },
    action: async(message) => {
        message.author.sendMessage("Your messages were removed: Rapid message spam is not permitted.");

        //Reset floodcount & remove messages
        let key = message.author.id + ":floodcount";
        const msgCount = await DBManager.redis.getAsync(key);
        let res = await message.channel.fetchMessages({limit: 40});
        res.array()
            .filter(msg => msg.author.id == message.author.id)
            .sort((a, b) => b - a)
            .slice(0, msgCount)
            .forEach(msg => msg.delete());

        DBManager.redis.del(key);

        //Punish
        try {
            let actionData = await UserUtils.increaseNotoriety(message.author.id);
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Flood-Spam Filter",
                triggerMessage: "MULTIPLE MESSAGES"
            });
            infraction.save();
            Logging.infractionLog(infraction);
        } catch (err) {
            Logging.error("FLOOD_FILTER_ACTION", err);
        }
    }
};

filters.duplicateMessageFilter = {
    displayName: "Duplicate Message Filter",
    check: async(message) => {
        //Define key
        let key = message.author.id + ":lastMessage";


        let res = await DBManager.redis.existsAsync(key);
        //Create key if it does not exist yet and stop here
        if (!res) {
            DBManager.redis.set(key, message.content);
            DBManager.redis.expire(key, 20);
            return false;
        }
        //Check if content matches
        res = await DBManager.redis.getAsync(key);
        //TODO: Add check that covers slight variations
        return message.content === res;
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Identical consecutive messages are not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Duplicate Message Filter",
            triggerMessage: message.content
        });
        infraction.save();
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(infraction);
    }
};


module.exports.filters = filters;
