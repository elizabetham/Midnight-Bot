//@flow

import QueueItem from './QueueItem';
import {yt} from './MusicTools';
import Config from '../../config';
import {Redis, BlacklistedVideo} from '../utils/DBManager';
import OffensiveBehaviourFilter from '../chatfilters/all/OffensiveBehaviourFilter';
import RacismFilter from '../chatfilters/all/RacismFilter';

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
                    key: Config.YOUTUBE_API_KEY
                        ? Config.YOUTUBE_API_KEY
                        : "",
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
                if (e.e == "SEARCH_RESOLVE_ERROR" || e.e == "NO_RESULTS_FOUND") {
                    throw e;
                }
                console.log(e);
                throw {e: "SEARCH_ERROR"};
            }
        }

        //Check if already on queue
        if (this.queue.filter(item => item.videoInfo.video_id == videoInfo.video_id).length > 0) {
            throw {e: "DUPLICATE_ENTRY"};
        }

        //Check if blacklisted temporarily
        let blacklistKey = videoInfo.video_id + ":MusicTmpBlacklist";
        let res = await Redis.existsAsync(blacklistKey);
        if (res) {
            throw {e: "BLACKLISTED_TEMPORARILY"};
        }

        //Check if blacklisted permanently
        if (await BlacklistedVideo.findOne({ytid: videoInfo.video_id})) {
            throw {e: "BLACKLISTED_PERMANENTLY"};
        }

        //Check title filters
        if (!this.checkTitle(videoInfo.title)) {
            throw {e: "FILTERED_TITLE"};
        }

        //Check song length
        if (videoInfo.length_seconds > 60 * 10) {
            throw {e: "CONTENT_TOO_LONG"};
        }

        //Push new video onto queue
        const newItem = new QueueItem(requestedBy, videoInfo);
        this.queue.push(newItem);

        //Return the found video
        return newItem;
    }

    checkTitle : Function;

    async checkTitle(title : string) {
        //Check with racism & offensive behaviour chat filters
        if (await OffensiveBehaviourFilter.check({content: title})) {
            return false;
        }
        if (await RacismFilter.check({content: title})) {
            return false;
        }

        //Custom rules
        let rules = [];
        return rules.filter(rule => title.match(rule)).length == 0;
    }

}

export default MusicQueue;
