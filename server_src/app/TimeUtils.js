// @flow
//
export const readableInterval = (seconds : number) => {
    let numyears = Math.floor(seconds / 31536000);
    let numdays = Math.floor((seconds % 31536000) / 86400);
    let numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    let numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    let numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    let ret = "";
    if (numyears > 0)
        ret += numyears + "y ";
    if (numdays > 0)
        ret += numdays + "d ";
    if (numhours > 0)
        ret += numhours + "h ";
    if (numminutes > 0)
        ret += numminutes + "m ";
    if (numseconds > 0)
        ret += numseconds + "s ";
    return ret.trim();
};

export default {
    readableInterval
}
