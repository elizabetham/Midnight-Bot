var mongoose = require('mongoose');
const config = require('./../data/config.js');

//connect to database
mongoose.connect(config.database);

//Define schemas
var UserRecord = mongoose.model('UserRecord', new mongoose.Schema({
        userid: {type: String, required: true},
        banned: {type: Boolean, required: true},
        mutedUntil: {type: Number, required: true},
        infractionLevel: {type: Number, required: true},
        decreaseWhen: {type: Number, required: true},
        lastWritten: {type: Number, required: true},
        username: {type: String, required: true}
    })
);

var ActionRecord = mongoose.model('ActionRecord', new mongoose.Schema({
        userid: {type: String, required: true},
        actionType: {type: String, required: true},
        timestamp: {type: Number, required: true},
        data: mongoose.Schema.Types.Mixed,
        triggerMessage: String
    })
);

//Export module
module.exports = {"UserRecord": UserRecord, "ActionRecord": ActionRecord};