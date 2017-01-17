// @flow

//Dependencies
import FluxStore from './FluxStore';
import AppDispatcher from '../dispatcher/AppDispatcher';
import EventEmitter from 'events';

//Action creators
import InfractionActions from '../actions/InfractionActions';

//Types
import type {$Infraction}
from '../types/InfractionType';
import type {$Action}
from '../types/ActionType';
import type {$User}
from '../types/UserType';
type $StoreState = |'ERROR' | 'NO_USER';

//Constants
const CHANGE_EVENT : string = 'change';

//Store data
let _infractions : Array < $Infraction > = [];
let _userSearchResults : Array < $User > = [];
let _fetchingData : boolean = false;

//Modifiers
function setInfractions(infractions : Array < $Infraction >) {
    _infractions = infractions;
}

function setUserSearchResults(results : Array < $User >) {
    _userSearchResults = results;
}

function setFetchStatus(status : boolean) {
    _fetchingData = status;
}

//Store class
class InfractionStoreClass extends FluxStore {

    constructor() {
        super();
    }

    getInfractions() : Array < $Infraction > {
        return _infractions;
    }

    getUserSearchResults() : Array < $User > {
        return _userSearchResults;
    }

    isFetchingData() : boolean {return _fetchingData;}

};

//Instantiation
let InfractionStore : InfractionStoreClass = new InfractionStoreClass();

//Action handler
InfractionStore.dispatchToken = AppDispatcher.register((action : $Action) => {
    switch (action.actionType) {
        case "RETRIEVE_USER_SEARCH":
            setFetchStatus(true);
            break;
        case "RECEIVE_INFRACTION_USER_SEARCH":

            //We're no longer fetching
            setFetchStatus(false);
            //Store the search results
            setUserSearchResults(action.results);

            //Check if we have an exact match
            let searchQuery = action.query.toLowerCase().trim();
            let exactMatch = InfractionStore.getUserSearchResults().filter(result => {
                return result.username.toLowerCase() == searchQuery || result.userid == searchQuery;
            });

            //If we have an exact match or there is just one result, retrieve infractions for that result
            if (InfractionStore.getUserSearchResults().length == 1 || exactMatch.length > 0) {
                //TODO: Find alternative for chaining events
                const userid = exactMatch.length > 0
                    ? exactMatch[0].userid
                    : action.results[0].userid;
                setTimeout(() => {
                    InfractionActions.retrieveInfractions(userid);
                }, 0);
            } else { //If there is no single applicable result, clear out the infractions
                setInfractions([]);
            }

            //Let listening components know there's an update
            InfractionStore.emitChange();
            break;
        case "RECEIVE_INFRACTION_USER_SEARCH_ERROR":
            console.error("An unknown error occurred retrieving user search results.", action.response);
            setFetchStatus(false);
            setUserSearchResults([]);
            setInfractions([]);
            InfractionStore.emitChange();
            break;
        case "RETRIEVE_INFRACTIONS":
            setFetchStatus(true);
            break;
        case "RECEIVE_INFRACTIONS":
            setFetchStatus(false);
            setInfractions(action.infractions);
            InfractionStore.emitChange();
            break;
        case "RECEIVE_INFRACTIONS_ERROR":
            setFetchStatus(false);
            switch (action.response.status) {
                case 404: //User does not exist
                    break;
                default: //Some error went down
                    console.log("Unknown error occurred while receiving infractions.");
                    break;
            }
            setInfractions([]);
            InfractionStore.emitChange();
            break;
    }
});

export default InfractionStore;
