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
        case "RETRIEVING_USER_SEARCH":
            setFetchStatus(true);
            break;
        case "RECEIVE_INFRACTION_USER_SEARCH":
            setFetchStatus(false);
            setUserSearchResults(action.results);
            if (InfractionStore.getUserSearchResults().length == 1) {
                //TODO: Find alternative for chaining events
                const userid = action.results[0].userid;
                setTimeout(() => {
                    InfractionActions.retrieveInfractions(userid);
                }, 0);
            } else {
                setInfractions([]);
            }
            InfractionStore.emitChange();
            break;
        case "RECEIVE_INFRACTION_USER_SEARCH_ERROR":
            console.error("An unknown error occurred retrieving user search results.", action.response);
            setFetchStatus(false);
            setUserSearchResults([]);
            setInfractions([]);
            InfractionStore.emitChange();
            break;
        case "RETRIEVING_INFRACTIONS":
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
