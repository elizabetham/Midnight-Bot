// @flow

import {InfractionRecord} from '../utils/DBManager';
import Logging from '../utils/Logging';
import UserUtils from '../utils/UserUtils';

export type $FilterData = {
    displayName: string,
    triggerMessage: string
}

export type $InfractionAction = {
    type: 'WARN',
    increasedNotoriety: boolean
} | {
    type: 'MUTE',
    increasedNotoriety: boolean,
    meta: number
} | {
    type: 'MUTE_LIFT',
    increasedNotoriety: boolean
} | {
    type: 'BAN',
    increasedNotoriety: boolean
} | {
    type: 'UNBAN',
    increasedNotoriety: boolean
} | {
    type: 'NONE',
    increasedNotoriety: boolean
}

export type $ManualData = {
    executor: string,
    reason?: ?string
}

class Infraction {
    userid : string;
    timestamp : number;
    action : $InfractionAction;
    filter :
        ? $FilterData;
    manual :
        ? $ManualData;
    save : Function;

    constructor(userid : string, timestamp : number, action : $InfractionAction, filter :
        ? $FilterData, manual :
        ? $ManualData) {
        this.userid = userid;
        this.timestamp = timestamp;
        this.action = action;
        this.filter = (filter)
            ? filter
            : null;
        this.manual = (manual)
            ? manual
            : null;

        this.save = this.save.bind(this);
    }

    async save() : InfractionRecord {
        let infraction = new InfractionRecord(this);
        try {
            let actions = [
                infraction.save(),
                UserUtils.assertUserRecord(this.userid)
            ];
            if (this.manual) {
                actions.push(UserUtils.assertUserRecord(this.manual.executor));
            }
            return (await Promise.all(actions))[0];
        } catch (err) {
            Logging.error("LOG_INFRACTION_SAVE", err);
        }
        return null;
    }

}

export default Infraction;
