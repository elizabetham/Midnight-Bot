// @flow

//Modules
const DBManager = require("./DBManager.js");
const DiscordUtils = require("./DiscordUtils.js");
const Logging = require("./Logging.js");

//Config
const config = require("../config.js");

//Dependencies
const express = require("express");
const escapeStringRegexp = require('escape-string-regexp');

//Initialize express
const app = express();
const apiRouter = express.Router();

//Register static content
app.use(express.static('app/res/htdocs'));

//Allow CORS
if (config.allowCORS) {
    console.log("Warning: Allowing CORS!");
    app.use(require("cors")());
}

//API FUNCTIONS
apiRouter.post('/user/search', async function(req, res) {
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

    let records = (await DBManager.UserRecord.find({
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

apiRouter.get('/user/:id', async function(req, res) {
    //Retrieve user record
    let userRecord = await DBManager.UserRecord.findOne({userid: req.params.id});

    //If this user does not exist, report that
    if (!userRecord) {
        res.status(404).json({error: "No user found with this id."});
        return;
    }

    //Return object
    res.status(200).json({userid: userRecord.userid, username: userRecord.username, username_lower: userRecord.username_lower, notoriety: userRecord.notoriety});
});

apiRouter.get('/user/:id/infractions', async function(req, res) {
    //Retrieve user record
    let userRecord = await DBManager.UserRecord.findOne({userid: req.params.id});

    //If this user does not exist, report that
    if (!userRecord) {
        res.status(404).json({error: "No user found with this id."});
        return;
    }

    //Retrieve the infractions
    let infractions = await DBManager.Infraction.find({userid: userRecord.userid}).sort({timestamp: -1}).lean();

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
app.listen(config.HTTP_PORT, () => {
    console.log("Express listening on port " + config.HTTP_PORT);
});
