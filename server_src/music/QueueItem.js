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
            let stats = fs.statSync(file);
            //Return the existing file if it has a filesize
            if (stats.size > 0) {
                return file;
            } else {
                //If the file size is 0, delete the file
                fs.unlinkSync(file);
            }
        }

        try {
            //Start the download
            console.log("Start download: '" + this.videoInfo.title + "'");
            await yt.download(this.videoInfo, file);

            //We're done downloading, let's verify the result
            let stats = fs.statSync(file);
            if (stats.size == 0) {
                //Delete the file if its filesize is 0
                fs.unlinkSync(file);
                throw "INCORRECT_FILESIZE";
            }

            //let's return the path
            console.log("Finished download: '" + this.videoInfo.title + "'");
            return file;
        } catch (err) {
            //Report that download failed.
            console.log(err);
            console.log("FAILED download: '" + this.videoInfo.title + "'");

            //Attempt deleting the failed download
            try {
                fs.unlinkSync(file);
            } catch (err) {}

            //Throw exception
            throw {msg: "FAILED_DOWNLOAD", e: err};
        }
    }

}

export default QueueItem;
