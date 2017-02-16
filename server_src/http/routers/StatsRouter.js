// @flow

//Dependencies
import express from 'express';
import {InfractionRecord, UserRecord} from '../../utils/DBManager';
import moment from 'moment';
import _ from 'lodash';

//Types
import type {$Request, $Response}
from 'express';

//Create api router
const router = express.Router();

//Endpoints
router.get('/djleaderboard', async function(req : $Request, res : $Response) {
    try {
        res.status(200).json((await UserRecord.find({
            djAwardPoints: {
                $gt: 0
            }
        }).sort({djAwardPoints: -1}).limit(50).lean()));
    } catch (e) {
        console.log(e);
        res.status(500).json({"error:": "Internal server error"});
    }
});

router.get('/infractionstats', async function(req : $Request, res : $Response) {

    let getTimeData = async(buckets : number, interval : number) => {
        const current : number = new Date(Math.ceil(new Date().getTime() / 1000 / interval) * interval * 1000).getTime() / 1000;

        const data = [];

        let results = await InfractionRecord.find({
            timestamp: {
                $gte: (current - interval * (buckets)),
                $lt: current
            }
        }).lean();

        for (let i = 0; i < buckets; i++) {
            let selectiveResults = results.filter(inf => inf.timestamp >= (current - interval * (i + 1)) && inf.timestamp < (current - interval * i));
            await InfractionRecord.find({
                timestamp: {
                    $gte: (current - interval * (i + 1)),
                    $lt: (current - interval * i)
                }
            }).lean();

            data.push({
                key: moment.unix(current - interval * (i + 1)),
                values: _.chain(selectiveResults).groupBy('action.type').mapValues('length').value()
            });
        }

        return data;
    }

    let data = {
        hoursChart: (await getTimeData(48, 3600)).reverse(),
        daysChart: (await getTimeData(7, 3600 * 24)).reverse(),
        monthChart: (await getTimeData(31, 3600 * 24)).reverse(),
        infractionCount: await InfractionRecord.count({}),
        autoInfractionCount: await InfractionRecord.count({"manual": null}),
        manualInfractionCount: await InfractionRecord.count({
            "manual": {
                "$ne": null
            }
        }),
        actionTypeChart: await Promise.all((await InfractionRecord.find().distinct("action.type")).map(async(actionType) => {
            return {
                "type": actionType,
                "count": await InfractionRecord.count({"action.type": actionType})
            };
        }))
    };

    res.json(data);

});

export default router;
