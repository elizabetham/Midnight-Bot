// @flow

//Modules
import {UserRecord, InfractionRecord} from './DBManager';
import DiscordUtils from './DiscordUtils';
import Logging from './Logging';

//Config
import Config from '../config';

//Dependencies
import express from 'express';
import escapeStringRegexp from 'escape-string-regexp';

//Types
import type {$Request, $Response}
from 'express';

//Initialize express
const app = express();

const apiRouter = express.Router();

//Register static content
app.use(express.static('app/res/htdocs'));

//Allow CORS
if (Config.allowCORS) {
    console.log("Warning: Allowing CORS!");
    app.use(require("cors")());
}

//API FUNCTIONS
apiRouter.post('/user/search', async function(req : $Request, res : $Response) {
    //Make sure query parameter is present
    if (!req.query.hasOwnProperty("q")) {
        res.status(400).json({error: "missing 'q' query parameter"});
        return;
    }

    if (req.query.q.length == 0) {
        res.status(200).json([]);
        return;
    };

    let query = new RegExp(escapeStringRegexp(req.query.q), 'i');

    let records = (await UserRecord.find({
        $or: [
            {
                username: query
            }, {
                userid: query
            }
        ]
    }).limit(10).sort({username: 1}).lean()).map(d => {
        return {username: d.username, userid: d.userid}
    });

    //Return the user id
    res.status(200).json(records);
});

apiRouter.get('/user/:id', async function(req : $Request, res : $Response) {
    //Retrieve user record
    let userRecord = await UserRecord.findOne({userid: req.params.id});

    //If this user does not exist, report that
    if (!userRecord) {
        res.status(404).json({error: "No user found with this id."});
        return;
    }

    //Return object
    res.status(200).json({userid: userRecord.userid, username: userRecord.username, username_lower: userRecord.username_lower, notoriety: userRecord.notoriety});
});

apiRouter.get('/user/:id/infractions', async function(req : $Request, res : $Response) {
    //Retrieve user record
    let userRecord = await UserRecord.findOne({userid: req.params.id});

    //If this user does not exist, report that
    if (!userRecord) {
        res.status(404).json({error: "No user found with this id."});
        return;
    }

    //Retrieve the infractions
    let infractions = await InfractionRecord.find({userid: userRecord.userid}).sort({timestamp: -1}).lean();

    //Add username data to infractions
    infractions.forEach(i => {
        i.username = userRecord.username;
    });

    //Return the data
    res.status(200).json(infractions);
});

//Add API router;
app.use('/api', apiRouter);

//Start HTTP server
app.listen(Config.HTTP_PORT, () => {
    console.log("Express listening on port " + Config.HTTP_PORT);
});;;
