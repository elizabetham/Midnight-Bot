export type $StatisticsData = {
    hoursChart: Array < {
        key: string,
        values: Object
    } >,
    daysChart: Array < {
        key: string,
        values: Object
    } >,
    monthChart: Array < {
        key: string,
        values: Object
    } >,
    infractionCount: number,
    autoInfractionCount: number,
    manualInfractionCount: number,
    actionTypeChart: Array < {
        type: string,
        count: number
    } >
}
