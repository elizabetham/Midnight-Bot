//@flow

import ytdl from 'ytdl-core';
import ytsearch from 'youtube-search';
import promisify from 'promisify-any';

export const yt = {
    getInfo: promisify(ytdl.getInfo, 1),
    search: promisify(ytsearch, 2),
    stream: ytdl.downloadFromInfo
};
