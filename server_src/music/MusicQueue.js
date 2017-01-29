//@flow

import QueueItem from './QueueItem';
import {yt} from './MusicTools';
import Config from '../../config';

class MusicQueue {

    queue : Array < QueueItem >;
    maxQueueSize : number;

    constructor(maxQueueSize : number) {
        this.queue = [];
        this.maxQueueSize = maxQueueSize;
        this.size = this.size.bind(this);
        this.pop = this.pop.bind(this);
        this.push = this.push.bind(this);
        this.getArray = this.getArray.bind(this);
    }

    getArray : Function;

    getArray() : Array < QueueItem > {
        return this.queue;
    }

    size : Function;

    size() {
        return this.queue.length;
    }

    pop : Function;

    pop() {
        return this.queue.shift();
    }

    push : Function;

    async push(query : string, requestedBy : string) : Object {
        //Quit if queue is already full
        if(this.queue.length >= this.maxQueueSize) {
            throw {e: "QUEUE_FULL"};
        }

        //First assume it's a URL
        let videoInfo;
        try {
            videoInfo = await yt.getInfo(query);
        } catch (e) {
            //Not a URL, let's do a search.
            try {
                const searchRes = await yt.search(query, {
                    maxResults: 1,
                    key: Config.YOUTUBE_API_KEY,
                    type: 'video'
                });

                //Check if we found results
                if (searchRes[0].length == 0) {
                    throw {e: "NO_RESULTS_FOUND"};
                }

                //Obtain the video info of the found result
                try {
                    videoInfo = await yt.getInfo(searchRes[0][0].link);
                } catch (e) {
                    console.log("ATTEMPTED RESOLVE", searchRes[0][0].link, e);
                    throw {e: "SEARCH_RESOLVE_ERROR"};
                }
            } catch (e) {
                //We cannot find results. Quit here.
                if (e.e == "SEARCH_RESOLVE_ERROR") {
                    throw e;
                }
                console.log(e);
                throw {e: "SEARCH_ERROR"};
            }
        }

        if (this.queue.filter(item => item.videoInfo.video_id == videoInfo.video_id).length > 0) {
            throw {e: "DUPLICATE_ENTRY"};
        }

        //Push new video onto queue
        const newItem = new QueueItem(requestedBy, videoInfo);
        this.queue.push(newItem);

        //Return the found video
        return newItem;
    }

}

export default MusicQueue;
