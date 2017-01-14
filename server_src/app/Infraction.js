// @flow
import {InfractionRecord} from './DBManager';
import Logging from './Logging';

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
    type: 'NONE',
    increasedNotoriety: boolean
}

class Infraction {
    userid : string;
    timestamp : number;
    action : $InfractionAction;
    filter :
        ? $FilterData;
    save : Function;

    constructor(userid : string, timestamp : number, action : $InfractionAction, filter :
        ? $FilterData) {
        this.userid = userid;
        this.timestamp = timestamp;
        this.action = action;
        this.filter = (filter)
            ? filter
            : null;
        this.save = this.save.bind(this);
    }

    save() {
        let infraction = new InfractionRecord(this);
        infraction.save(err => {
            if (err)
                Logging.error("LOG_INFRACTION_SAVE", err);
            }
        );
    }

}

export default Infraction;
