// @flow

import type {$Infraction}
from './InfractionType';
import type {$User}
from '../types/UserType';

export type $Action = {
    actionType: "RECEIVE_INFRACTIONS",
    infractions: Array < $Infraction >
} | {
    actionType: "RECEIVE_INFRACTIONS_ERROR",
    response: Object
} | {
    actionType: "RECEIVE_INFRACTION_USER_SEARCH",
    results: Array < $User >
} | {
    actionType: "RECEIVE_INFRACTION_USER_SEARCH_ERROR",
    response: Object
} | {
    actionType: "RETRIEVING_INFRACTIONS"
} | {
    actionType: "RETRIEVING_USER_SEARCH"
};
