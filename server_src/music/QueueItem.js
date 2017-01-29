//@flow

class QueueItem {

    requestedBy : string;
    videoInfo : Object;

    constructor(requestedBy : string, videoInfo : Object) {
        if (!videoInfo)
            throw "FALSY videoInfo PARAMETER";
        this.requestedBy = requestedBy;
        this.videoInfo = videoInfo;
    }

}

export default QueueItem;
