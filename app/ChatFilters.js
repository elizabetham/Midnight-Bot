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
module.exports.process = message => {
    for (let filter in filters) {
        if (!filters.hasOwnProperty(filter)) continue;
        filters[filter].check(message).then(res => {
            if (res) filters[filter].action(message);
        }).catch(err => {
            Logging.error("GENERIC_FILTER_ERROR", err);
        });
    }
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
    action: (message) => {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not permitted to mention members from the 'Grandmaster Gang' directly.");

        //Punish
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Mention Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("MENTION_FILTER_ACTION", err);
        });
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
        message.author.sendMessage("Your message was removed: Spamming messages or posting messages with spam-like content is not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Repeated Character Filter",
            triggerMessage: message.content
        });
        infraction.save();
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
        message.author.sendMessage("Your message was removed: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Bazza Filter",
            triggerMessage: message.content
        });
        infraction.save();
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
        message.author.sendMessage("Your message was removed: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Emoji Spam Filter",
            triggerMessage: message.content
        });
        infraction.save();
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
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Bulk Mention Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("BULK_MENTION_FILTER_ACTION", err);
        });
    }
};

filters.discordInviteFilter = {
    displayName: "Discord Invite Filter",
    check: message => {
        return new Promise(resolve => {
            resolve(message.content.match(/.*discord\.gg\/.*/gi));
        });
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: It is not allowed to advertise other Discord servers in our guild.");

        //Punish
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Discord Invite Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("DISCORD_INVITE_FITLER_ACTION", err);
        });
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
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: The use of racist or discriminative terms is not permitted here.");

        //Punish
        UserUtils.increaseNotoriety(message.author.id)
            .then((actionData) => {
                let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                    displayName: "Racism Filter",
                    triggerMessage: message.content
                });
                infraction.save();
                Logging.infractionLog(infraction);
            }).catch(err => {
            Logging.error("RACISM_FILTER_ACTION", err);
        });
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
                let filters = [/.*https{0,1}:\/\/.*/gi, /.*www.*/gi];
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
        Logging.infractionLog(infraction);
    }
};

filters.floodFilter = {
    displayName: "Flood-Spam Filter",
    check: message => {
        const MESSAGES = 5; //messages per
        const SECONDS = 10; //period of seconds
        //Define key
        let key = message.author.id + ":floodcount";

        return DBManager.redis.existsAsync(key)
            .then(res => {
                //Create key if it does not exist yet
                if (!res) {
                    DBManager.redis.set(key, 0);
                    DBManager.redis.expire(key, SECONDS);
                }
                //Increment message count
                DBManager.redis.incr(key);
                return DBManager.redis.getAsync(key);
            })
            .then(res => new Promise(resolve => {
                resolve(res > MESSAGES);
            }));
    },
    action: message => {
        message.author.sendMessage("Spamming messages or posting messages with spam-like content is not permitted.");

        //Reset floodcount & remove messages
        let key = message.author.id + ":floodcount";
        DBManager.redis.getAsync(key).then(res => {
            const msgCount = res;
            message.channel.fetchMessages({limit: 40}).then(res => {
                res.array().filter(msg => msg.author.id == message.author.id).sort((a, b) => b - a).slice(0, msgCount).forEach(msg => {
                    msg.delete();
                });
            });
            DBManager.redis.del(key);
        });

        //Punish
        UserUtils.increaseNotoriety(message.author.id)
            .then((actionData) => {
                let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                    displayName: "Flood-Spam Filter",
                    triggerMessage: "MULTIPLE MESSAGES"
                });
                infraction.save();
                Logging.infractionLog(infraction);
            }).catch(err => {
            Logging.error("FLOOD_FILTER_ACTION", err);
        });
    }
};

filters.duplicateMessageFilter = {
    displayName: "Duplicate Message Filter",
    check: message => {
        //Define key
        let key = message.author.id + ":lastMessage";

        return DBManager.redis.existsAsync(key)
            .then(res => {
                //Create key if it does not exist yet and stop here
                if (!res) {
                    DBManager.redis.set(key, message.content);
                    DBManager.redis.expire(key, 20);
                    return new Promise(resolve => {
                        resolve(false);
                    });
                }
                //Check if content matches
                return DBManager.redis.getAsync(key).then(res => {
                    return new Promise(resolve => {
                        //TODO: Add check that covers slight variations
                        resolve((message.content == res));
                    });
                });
            });
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Identical consecutive messages are not permitted.");
        let infraction = new Infraction(message.author.id, moment().unix(), false, "WARN", null, {
            displayName: "Duplicate Message Filter",
            triggerMessage: message.content
        });
        infraction.save();
        Logging.infractionLog(infraction);
    }
};


module.exports.filters = filters;
