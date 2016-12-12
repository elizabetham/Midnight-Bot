//MODULES
const UserUtils = require("./UserUtils.js");
const Logging = require("./Logging.js");
const Infraction = require("./Infraction.js");

//Config
const config = require("../config.js");

//DEPENDENCIES
const moment = require("moment");
const emojiRegex = require("emoji-regex");

//FUNCTIONS
module.exports.process = message => {
    for (let filter in filters) {
        if (!filters.hasOwnProperty(filter)) continue;
        if (filters[filter].check(message)) {
            filters[filter].action(message);
            break;
        }
    }
};

//FILTERS

let filters = {};
filters.mentionFilter = {
    displayName: "Mention Filter",
    check: (message) => {
        return message.mentions.users
                .array()
                .filter(u => config.prohibitedMentions.indexOf(u.username) > -1)
                .length > 0;
    },
    action: (message) => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: It is not permitted to mention members from the 'Grandmaster Gang' directly.");

        //Punish
        let self = this;
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
        return message.content.match(/.*([^.\s])\1{6,}.*/gi);
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let self = this;
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Repeated Character Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("REPEATED_CHARACTER_FILTER_ACTION", err);
        });
    }
};

filters.bazzaFilter = {
    displayName: "Bazza Filter",
    check: message => {
        return message.content.match(/.*b+a+z+a{4,}.*/gi);
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let self = this;
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Bazza Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("BAZZA_FILTER_ACTION", err);
        });
    }
};

filters.emojiSpamFilter = {
    displayName: "Emoji Spam Filter",
    check: message => {
        let matches = message.content.match(emojiRegex());
        return matches && matches.length >= 10;
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let self = this;
        UserUtils.increaseNotoriety(message.author.id).then(actionData => {
            let infraction = new Infraction(message.author.id, moment().unix(), true, actionData.type, actionData.meta, {
                displayName: "Emoji Spam Filter",
                triggerMessage: message.content
            });
            infraction.save();
            Logging.infractionLog(infraction);
        }).catch(err => {
            Logging.error("EMOJI_SPAM_FILTER_ACTION", err);
        });
    }
};

filters.bulkMentionFilter = {
    displayName: "Bulk Mention Filter",
    check: message => {
        return message.content.match(/.*@{5,}.*/gi);
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: Spamming messages or posting messages with spam-like content is not permitted.");

        //Punish
        let self = this;
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
        return message.content.match(/.*discord\.gg\/.*/gi);
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: It is not allowed to advertise other Discord servers in our guild.");

        //Punish
        let self = this;
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
        let rules = [
            /.*\bn+(i|1)+(g|6)+((a|4)+|(e|3)+r*|u+)h*s*\b.*/gi, //nigger
            /.*\bj+(e|3)+w+s*\b.*/gi, //jew
            /.*\bf+(4|a)*g+(e|3|o|0)*t*s*\b.*/gi //fag
        ];
        return rules.filter(rule => message.content.match(rule)).length > 0;
    },
    action: message => {
        message.delete();
        message.author.sendMessage("You have been issued an infraction: The use of racist or discriminative terms is not permitted here.");

        //Punish
        let self = this;
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
      let channels = ["249323706285948928","252543317844295680"];
      let filters = [/.*http:\/\/.*/gi, /.*www.*/gi];
      return channels.indexOf(message.channel.id) > -1 && filters.filter(regex => message.content.match(regex)).length > 0;
    },
    action: message => {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting links in the lobby channels is prohibited.");
        // Do not issue infraction for posting links, just keep the chat clean
    }
};

module.exports.filters = filters;
