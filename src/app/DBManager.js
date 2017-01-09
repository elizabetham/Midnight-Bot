'use strict';
//Modules & Dependencies
const mongoose = require("mongoose");
const config = require("../config.js");
const Logging = require("./Logging.js");
const redis = require("redis");
const bluebird = require("bluebird");

//Make redis promise compatible
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//connect to databases
mongoose.connect(config.database);
module.exports.redis = redis.createClient();

//Define mongoose schemas
module.exports.UserRecord = mongoose.model('UserRecord', new mongoose.Schema({
        userid: {type: String, required: true},
        mutedUntil: {type: Number, required: true},
        notoriety: {type: Number, required: true},
        decreaseWhen: {type: Number, required: true},
        username: {type: String, required: true},
        username_lower: {type: String, required: true}
    })
);

module.exports.Infraction = mongoose.model('Infraction', new mongoose.Schema({
        userid: {type: String, required: true},
        timestamp: {type: Number, required: true},
        filter: {
            displayName: String,
            triggerMessage: String
        },
        action: {
            increasedNotoriety: {type: Boolean, required: true},
            type: {type: String, required: true},
            meta: mongoose.Schema.Types.Mixed
        }
    })
);

//Handle redis errors
module.exports.redis.on("error", err => {
    Logging.error("REDIS_GENERIC_ERROR", err);
});