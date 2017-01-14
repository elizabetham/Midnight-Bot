// @flow
export type $Infraction = {
    _id: string,
    userid: string,
    timestamp: number,
    action: {
        increasedNotoriety: boolean,
        type: string,
        meta?: any
    },
    filter?: {
        displayName: string,
        triggerMessage: string
    },
    username: string
};
