'use strict';
let mongoose = require('mongoose');
const config = require('../config.js');

//connect to database
mongoose.connect(config.database);

//Define schemas
let UserRecord = mongoose.model('UserRecord', new mongoose.Schema({
        userid: {type: String, required: true},
        mutedUntil: {type: Number, required: true},
        notoriety: {type: Number, required: true},
        decreaseWhen: {type: Number, required: true},
        username: {type: String, required: true}
    })
);

let Infraction = mongoose.model('Infraction', new mongoose.Schema({
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
//Export module
module.exports = {"UserRecord": UserRecord, "Infraction": Infraction};