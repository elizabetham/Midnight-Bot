// @flow

import {GenericEvent as GenericEventRecord} from '../utils/DBManager';
import Logging from '../utils/Logging';
import moment from 'moment';

class GenericEvent {
    eventType : string;
    timestamp : number;
    initiatorUID :
        ? string;
    data : Object;
    save : Function;
    setInitiator : (string) => GenericEvent;
    setData : (Object) => GenericEvent;

    constructor(eventType : string) {
        this.eventType = eventType;
        this.timestamp = moment().unix();
        this.save = this.save.bind(this);
        this.setInitiator = this.setInitiator.bind(this);
        this.setData = this.setData.bind(this);
    }

    setInitiator(uid : string) : GenericEvent {
        this.initiatorUID = uid;
        return this;
    }

    setData(data : Object) : GenericEvent {
        this.data = data;
        return this;
    }

    async save() : GenericEventRecord {
        let record = new GenericEventRecord(this);
        try {
            return await record.save();
        } catch (err) {
            Logging.error("GENERIC_EVENT_SAVE", err);
        }
        return null;
    }

}

export default GenericEvent;
