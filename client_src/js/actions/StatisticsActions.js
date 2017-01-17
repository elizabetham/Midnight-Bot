// @flow
import AppDispatcher from '../dispatcher/AppDispatcher';
import MidnightAPI from '../utils/MidnightAPI';

export default {
    retrieveStatisticsData : async() => {
        try {
            let rawData = await MidnightAPI.getInfractionActivityStats();
            AppDispatcher.dispatch({actionType: "RECEIVE_STATISTICS_DATA", data: rawData});
        } catch (response) {
            AppDispatcher.dispatch({actionType: "RECEIVE_STATISTICS_DATA_ERROR", response});
        }
    }
}
