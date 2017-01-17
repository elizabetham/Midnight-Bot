// @flow

import type {$Infraction}
from './InfractionType';
import type {$User}
from '../types/UserType';
import type {$StatisticsData}
from '../types/StatisticsDataType';

export type $Action = {
    actionType: "RECEIVE_INFRACTIONS",
    infractions: Array < $Infraction >
} | {
    actionType: "RECEIVE_INFRACTIONS_ERROR",
    response: Object
} | {
    actionType: "RECEIVE_INFRACTION_USER_SEARCH",
    results: Array < $User >,
    query: string
} | {
    actionType: "RECEIVE_INFRACTION_USER_SEARCH_ERROR",
    response: Object,
    query: string
} | {
    actionType: "RETRIEVE_INFRACTIONS"
} | {
    actionType: "RETRIEVE_USER_SEARCH"
} | {
    actionType: "RECEIVE_STATISTICS_DATA",
    data: $StatisticsData
} | {
    actionType: "RECEIVE_STATISTICS_DATA_ERROR",
    response: Object
};
