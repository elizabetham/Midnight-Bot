const DBManager = require("./DBManager.js");
const Logging = require("./Logging.js");

module.exports = function (userid, timestamp, increasedNotoriety, actionType, actionMeta, filterData) {

    //Input checks
    if (filterData) {
        if (!filterData.hasOwnProperty("displayName")) throw "displayName field not specified in filterdata";
        if (!filterData.hasOwnProperty("triggerMessage")) throw "triggerMessage field not specified in filterdata";
    }
    if (!userid || !timestamp || !increasedNotoriety || !actionType)
        throw "Missing required parameters";

    let infraction = {
        userid: userid,
        timestamp: timestamp,
        action: {
            increasedNotoriety: increasedNotoriety,
            type: actionType,
            meta: actionMeta || null
        },
        filter: (!filterData) ? null : {
            displayName: filterData.displayName,
            triggerMessage: filterData.triggerMessage
        }
    };

    infraction.save = (function () {
        let infraction = new DBManager.Infraction(this);
        infraction.save(err => {
            if (err) Logging.error("LOG_INFRACTION_SAVE", err);
        });
    }).bind(infraction);

    return infraction;
};