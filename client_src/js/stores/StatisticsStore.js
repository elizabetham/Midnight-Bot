// @flow

//Dependencies
import FluxStore from './FluxStore';
import AppDispatcher from '../dispatcher/AppDispatcher';
import EventEmitter from 'events';

//Types
import type {$Action}
from '../types/ActionType';
import type {$StatisticsData}
from '../types/StatisticsDataType';

//Constants
const CHANGE_EVENT : string = 'change';

let _statisticsData : $StatisticsData = {
    hours: [],
    days: []
};

function setStatisticsData(newData : $StatisticsData) {
    _statisticsData = newData;
}

//Store class
class StatisticsStoreClass extends FluxStore {

    constructor() {
        super();
    }

    getData() : $StatisticsData {return _statisticsData;}
}

//Instantiation
let StatisticsStore = new StatisticsStoreClass();

//Action handler
StatisticsStore.dispatchToken = AppDispatcher.register((action : $Action) => {
    switch (action.actionType) {
        case "RECEIVE_STATISTICS_DATA":
            setStatisticsData(action.data);
            StatisticsStore.emitChange();
            break;
        case "RECEIVE_STATISTICS_DATA_ERROR":
            //We're not handling this yet, for now
            break;
    }
});

export default StatisticsStore;
