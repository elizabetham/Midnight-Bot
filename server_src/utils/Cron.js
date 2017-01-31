// @flow
import schedule from 'node-schedule';
import {UserRecord, InfractionRecord} from './DBManager';
import Logging from './Logging';
import DiscordUtils from './DiscordUtils.js';
import moment from 'moment';
import Config from '../../config';
import Infraction from '../datatypes/Infraction';

//Schedule the job
schedule.scheduleJob('*/10 * * * * *', () => {
    decreaseNotorietyLevel();
    unmuteApplicableUsers();
});
//Schedule cleanup
schedule.scheduleJob('*/1 * * *', () => {
    cleanupInfractions();
});

const unmuteApplicableUsers = () => {
    UserRecord.find({
        mutedUntil: {
            $gte: 0,
            $lte: moment().unix()
        }
    }, (err, docs) => {
        if (err) {
            Logging.error("CRON_UNMUTE_FIND", err);
            return;
        }
        docs.forEach(async doc => {
            if (!doc)
                return;

            //Reset muted timestamp
            doc.mutedUntil = -1;

            //Remove muted roles
            for (let guild of DiscordUtils.client.guilds) {
                let member = guild[1].members.get(doc.userid);
                if (!member)
                    continue;
                let role = await DiscordUtils.getRoleByName(guild[1], "Muted");
                member.removeRole(role);
                const record = await new Infraction(member.user.id, moment().unix(), {
                    type: 'MUTE_LIFT',
                    increasedNotoriety: false
                }).save();
                let permalink = Config.baseURL + "/#/infractions/" + record.userid + "/" + record._id;
                Logging.mod(Logging.format("MUTE LIFT", "issued to **" + member.user.username + "** (**" + member.user.id + "**): " + permalink));
            }

            //Save user record
            doc.save(err => {
                if (err)
                    Logging.error("CRON_UNMUTE_SAVE", err);
                }
            );
        });

    });
};

const decreaseNotorietyLevel = () => {
    UserRecord.find({
        notoriety: {
            $gt: 0
        },
        decreaseWhen: {
            $lte: moment().unix()
        }
    }, (err, docs) => {
        docs.forEach(doc => {
            if (!doc)
                return;

            //Update record
            doc.notoriety--;
            doc.decreaseWhen = moment().unix() + Config.leveldrop;
            doc.save(err => {
                if (err)
                    Logging.error("CRON_DECREASE_NOTORIETY_SAVE", err);
                }
            );

        });
    });
};

const cleanupInfractions = () => {
    //Loop over all infractions
    let infractionStream = InfractionRecord.find().stream();
    let cleanupCount = 0;
    let done = false;
    let logged = false;

    infractionStream.on('data', async(infraction) => {
        try {
            //Check if user record exists
            if (!(await UserRecord.find({userid: infraction.userid}))) {
                //If not, increment cleanup count and remove the infraction
                cleanupCount++;
                try {
                    infraction.remove();
                } catch (err) {
                    Logging.error("CRON_INFRACTION_CLEANUP_INFRACTION_REMOVE", err);
                }
            }

            //Send message
            if (cleanupCount > 0 && done && !logged) {
                Logging.bot("Cleaned up " + cleanupCount + " infraction records with invalid user record pointers.");
                logged = true;
            }
        } catch (err) {
            Logging.error("CRON_INFRACTION_CLEANUP_USER_FIND", err);
        }
    });

    //Handle errors
    infractionStream.on('error', (err) => {
        Logging.error("CRON_INFRACTION_CLEANUP_INFRACTION_STREAM", err);
    });

    //Let the managers know something's up
    infractionStream.on('close', () => {
        done = true;
    });
};

//Execute at startup
cleanupInfractions();
