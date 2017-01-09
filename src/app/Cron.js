"use strict";
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
    }
);
//Schedule cleanup
schedule.scheduleJob('* * */1 * * *', () => {
        cleanupInfractions();
    }
);

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
        notoriety: {$gt: 0},
        decreaseWhen: {$lte: moment().unix()}
    }, (err, docs) => {
        docs.forEach(doc => {
            if (doc == null) return;

            //Update record
            doc.notoriety--;
            doc.decreaseWhen = moment().unix() + config.leveldrop;
            doc.save(err => {
                if (err) Logging.error("CRON_DECREASE_NOTORIETY_SAVE", err);
            });

        });
    });
};

const cleanupInfractions = () => {
    //Loop over all infractions
    let infractionStream = DBManager.Infraction.find().stream();
    let cleanupCount = 0;
    infractionStream.on('data', async(infraction) => {
        try {
            //Check if user record exists
            if (!(await DBManager.UserRecord.find({userid: infraction.userid}))) {
                //If not, increment cleanup count and remove the infraction
                cleanupCount++;
                try {
                    infraction.remove();
                } catch (err) {
                    Logging.error("CRON_INFRACTION_CLEANUP_INFRACTION_REMOVE", err);
                }
            }
        } catch (err) {
            Logging.error("CRON_INFRACTION_CLEANUP_USER_FIND", err);
        }
    });

    //Handle errors
    infractionStream.on('error', function (err) {
        Logging.error("CRON_INFRACTION_CLEANUP_INFRACTION_STREAM", err);
    });

    //Let the managers know something's up
    infractionStream.on('close', function () {
        if (cleanupCount > 0) Logging.bot("Cleaned up " + cleanupCount + " infraction records with invalid user record pointers.");
    });
};

//Execute at startup
cleanupInfractions();