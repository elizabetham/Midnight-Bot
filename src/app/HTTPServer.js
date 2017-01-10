//Modules
const DBManager = require("./DBManager.js");
const DiscordUtils = require("./DiscordUtils.js");
const Logging = require("./Logging.js");

//Config
const config = require("../config.js");

//Dependencies
const express = require("express");

//Initialize express
const app = express();

app.use(express.static('app/res/htdocs'));

app.get('/api/infractions', async function (req, res) {
    //Verify input
    if (!req.query.hasOwnProperty("user")) {
        res.status(400).json({error: "missing 'user' parameter"});
    }

    //Obtain input
    let userRef = req.query.user;
    let amount = (function () {
        try {
            return parseInt(req.query.amount);
        } catch (e) {
            return 5;
        }
    })();
    let before = (function () {
        try {
            return parseInt(req.query.before);
        } catch (e) {
            return -1;
        }
    })();

    let query = {$or: [{userid: userRef}, {username_lower: userRef.toLowerCase()}]};

    try {

        let userRecord = await DBManager.UserRecord.findOne(query);

        if (!userRecord) {
            res.status(404).json({error: "There are no logs about this user."});
            return;
        }

        let query = {userid: userRecord.userid};
        if (before !== -1) query.timestamp = {$lt: before};
        try {
            let infractions = await DBManager.Infraction.find(query).sort({timestamp: -1}).limit(amount);
            let nInfractions = [];
            for (let infraction of infractions) {
                let nInfraction = JSON.parse(JSON.stringify(infraction));
                nInfraction.username = userRecord.username;
                nInfractions.push(nInfraction);
            }
            res.status(200).json({data: nInfractions});
        } catch (err) {
            Logging.error("Infraction_FIND_INFRACTIONS_HTTP", err);
            res.status(500).json({error: "An internal error occurred. Please try again later!"});
        }

    } catch (err) {
        Logging.error("UserRecord_FIND_INFRACTIONS_HTTP", err);
        res.status(500).json({error: "An internal error occurred. Please try again later!"});
    }

});

app.listen(config.HTTP_PORT, () => {
    console.log("Express listening on port " + config.HTTP_PORT);
});