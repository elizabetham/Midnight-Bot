// @flow

//Dependencies
import express from 'express';
import {InfractionRecord} from '../DBManager';
import moment from 'moment';
import _ from 'lodash';
import {middleware as cache} from 'apicache';

//Types
import type {$Request, $Response}
from 'express';

//Create api router
const router = express.Router();

//Endpoints
router.get('/infractionactivity', cache('1 hour'), async function(req : $Request, res : $Response) {

    let getData = async(buckets : number, interval : number, labelformat : string) => {
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
                key: moment.unix(current - interval * (i + 1)).format(labelformat),
                values: _.chain(selectiveResults).groupBy('action.type').mapValues('length').value()
            });
        }

        return data;
    }

    res.json({
        hours: (await getData(48, 3600, "LT")).reverse(),
        days: (await getData(7, 3600 * 24, "dddd")).reverse()
    });

});

export default router;
