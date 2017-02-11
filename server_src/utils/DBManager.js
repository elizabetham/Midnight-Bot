// @flow

//Modules & Dependencies
import mongoose from 'mongoose';
import redis from 'redis';
import bluebird from 'bluebird';

import Logging from './Logging';
import Config from '../../config';

//Replace mpromise with ES6 promises within Mongoose
mongoose.Promise = global.Promise;

//Make redis promise compatible
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//connect to databases
mongoose.connect(Config.database);

//export redis
const redisClient = redis.createClient();
export {redisClient as Redis};

//Define mongoose schemas
export const UserRecord = mongoose.model('UserRecord', new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    mutedUntil: {
        type: Number,
        required: true
    },
    notoriety: {
        type: Number,
        required: true
    },
    decreaseWhen: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    username_lower: {
        type: String,
        required: true
    }
}));

export const InfractionRecord = mongoose.model('Infraction', new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    filter: {
        type: {
            displayName: String,
            triggerMessage: String
        },
        required: false
    },
    manual: {
        type: {
            executor: {
                type: String,
                required: true
            },
            reason: String
        },
        required: false
    },
    action: {
        increasedNotoriety: {
            type: Boolean,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        meta: mongoose.Schema.Types.Mixed
    }
}));

export const BlacklistedVideo = mongoose.model('blacklistedvideo', new mongoose.Schema({
    ytid: {
        type: String,
        required: true
    },
    listedBy: {
        type: String,
        required: false
    }
}));

export const GenericEvent = mongoose.model('GenericEvent', new mongoose.Schema({
    initiatorUID: String,
    eventType: {
        required: true,
        type: String
    },
    timestamp: {
        required: true,
        type: Number
    },
    data: mongoose.Schema.Types.Mixed
}));

//Handle redis errors
redisClient.on("error", err => {
    Logging.error("REDIS_GENERIC_ERROR", err);
});
