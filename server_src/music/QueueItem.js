//@flow

import {yt} from './MusicTools';
import fs from 'fs';

class QueueItem {

    requestedBy : string;
    videoInfo : Object;

    constructor(requestedBy : string, videoInfo : Object) {
        if (!videoInfo)
            throw "FALSY videoInfo PARAMETER";
        this.requestedBy = requestedBy;
        this.videoInfo = videoInfo;
        this.download = this.download.bind(this);
    }

    download : Function;
    async download() {
        let cacheDir = "musicCache";
        let file = cacheDir + "/" + this.videoInfo.video_id + ".mp3";

        //Create cache directory if it does not yet exist
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        //Check if the download already exists.
        if (fs.existsSync(file)) {
            return file;
        }

        try {
            //Start the download
            console.log("Start download: '" + this.videoInfo.title + "'");
            await yt.download(this.videoInfo, file);

            //We're done downloading, let's return the path
            console.log("Finished download: '" + this.videoInfo.title + "'");
            return file;
        } catch (err) {
            //Report that download failed.
            console.log(err);
            console.log("FAILED download: '" + this.videoInfo.title + "'");
            throw {msg: "FAILED_DOWNLOAD", e: err};
        }
    }

}

export default QueueItem;
