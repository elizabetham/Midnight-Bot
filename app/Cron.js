const schedule = require('node-schedule');
const DBManager = require("./DBManager.js");
const Logging = require("./Logging.js");
const DiscordUtils = require("./DiscordUtils.js");
const moment = require("moment");
const config = require("../config.js");

//Schedule the job
schedule.scheduleJob('*/10 * * * * *', () => {
        decreaseNotorietyLevel();
        unmuteApplicableUsers();
        cleanup();
    }
);

//Utility functions
const cleanup = () => {
    //Remove level 0 peeps without infractions to reduce DB clutter
    DBManager.UserRecord.find({infractionLevel: 0, mutedUntil: {$lt: 0}}).then(res => {
        res.forEach(userRecord => {
            DBManager.Infraction.find({userid: userRecord.userid}).then(res => {
                if (res.length == 0) userRecord.remove();
            });
        });
    }).catch(err => {
        Logging.error("CRON_CLEANUP", err);
    });
};

const unmuteApplicableUsers = () => {
    DBManager.UserRecord.find({mutedUntil: {$gte: 0, $lte: moment().unix()}}, (err, docs) => {
        if (err) {
            Logging.error("CRON_UNMUTE_FIND", err);
            return;
        }
        docs.forEach(doc => {
            if (doc == null) return;

            //Reset muted timestamp
            doc.mutedUntil = -1;

            //Remove muted roles
            for (let guild of DiscordUtils.client.guilds) {
                let member = guild[1].members.get(doc.userid);
                if (!member) continue;
                Logging.mod(Logging.format("MUTE LIFT", "issued to _" + member.user.username + " (" + member.user.id + ")_"));
                DiscordUtils.getRole(guild[1], "Muted").then(role => {
                    member.removeRole(role);
                });
            }

            //Save user record
            doc.save(err => {
                if (err) Logging.error("CRON_UNMUTE_SAVE", err);
            });
        });

    });
};

const decreaseNotorietyLevel = () => {
    DBManager.UserRecord.find({
        infractionLevel: {$gt: 0},
        decreaseWhen: {$lte: moment().unix()},
        banned: false
    }, (err, docs) => {
        docs.forEach(doc => {
            if (doc == null) return;

            //Remove or update record
            if (doc.infractionLevel == 1) {
                doc.remove(err => {
                    if (err)
                        Logging.error("CRON_DECREASE_NOTORIETY_REMOVE", err);
                });
            }
            else {
                doc.infractionLevel--;
                doc.decreaseWhen = moment().unix() + config.leveldrop;
                doc.save(err => {
                    if (err) Logging.error("CRON_DECREASE_NOTORIETY_SAVE", err);
                });
            }
        });
    });
};