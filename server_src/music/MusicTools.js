// @flow

import ytdl from 'youtube-dl';
import ytsearch from 'youtube-search';
import promisify from 'promisify-any';

export const yt = {
    getInfo: (url : string) => {
        return promisify(ytdl.getInfo, 1)(url, ['-4'], {maxBuffer: 1000 *1024});
    },
    search: promisify(ytsearch, 2),
    stream: (url : string, options : Array < any >) => {
        return ytdl(url, options.concat(['-4']));
    }
};

export const secondsToTimestamp = (value : number) : string => {
    let hours = Math.floor(value / 3600);
    let minutes = Math.floor((value - hours * 3600) / 60);
    let seconds = (value - hours * 3600 - minutes * 60);
    return (hours > 0
        ? (hours < 10
            ? "0"
            : "") + hours + ":"
        : "") + (minutes < 10
        ? "0"
        : "") + minutes + ":" + (seconds < 10
        ? "0"
        : "") + seconds;
}

export const timestampToSeconds = (value : string) : number => {
    let strarr = value.split(':').reverse();
    let sec = 0;
    let units = [
        1, 60, 3600, 3600 * 24
    ];
    strarr.forEach((val, index) => {
        try {
            sec += units[index] * parseInt(val);
        } catch (e) {
            console.log(e);
        }
    });
    return sec;
}
