// @flow
import AppDispatcher from '../dispatcher/AppDispatcher';
import MidnightAPI from '../utils/MidnightAPI';

export default {
    retrieveInfractions : async(userid : string) => {
        AppDispatcher.dispatch({actionType: "RETRIEVE_INFRACTIONS"});
        try {
            let infractions = await MidnightAPI.getInfractions(userid);
            AppDispatcher.dispatch({actionType: "RECEIVE_INFRACTIONS", infractions});
        } catch (response) {
            AppDispatcher.dispatch({actionType: "RECEIVE_INFRACTIONS_ERROR", response});
        }
    },

    searchUser : async(query : string) => {
        AppDispatcher.dispatch({actionType: "RETRIEVE_USER_SEARCH"});
        try {
            let results = await MidnightAPI.userSearch(query);
            AppDispatcher.dispatch({actionType: "RECEIVE_INFRACTION_USER_SEARCH", results, query});
        } catch (response) {
            AppDispatcher.dispatch({actionType: "RECEIVE_INFRACTION_USER_SEARCH_ERROR", response, query});
        }
    }
}
