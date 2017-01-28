// @flow

import Config from '../../config';
import ytdl from 'ytdl-core';
import ytsearch from 'youtube-search';
import promisify from 'promisify-any';
import type {StreamDispatcher, VoiceConnection, VoiceChannel, Message, TextChannel}
from 'discord.js';
import _ from 'lodash';
import DiscordUtils from './DiscordUtils';

//Make promise compatible yt tools
const yt = {
    getInfo: promisify(ytdl.getInfo, 1),
    search: promisify(ytsearch, 2),
    stream: ytdl.downloadFromInfo
};

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

class MusicQueue {

    queue : Array < QueueItem >;
    maxQueueSize : number;
    manager : MusicManager;

    constructor(maxQueueSize : number, manager : MusicManager) {
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
            throw "QUEUE_FULL";
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
                    throw "NO_RESULTS_FOUND";
                }

                //Obtain the video info of the found result
                try {
                    videoInfo = await yt.getInfo(searchRes[0][0].link);
                } catch (e) {
                    console.log("ATTEMPTED RESOLVE", searchRes[0][0].link, e);
                    throw "SEARCH_RESOLVE_ERROR";
                }
            } catch (e) {
                //We cannot find results. Quit here.
                if (e == "SEARCH_RESOLVE_ERROR") {
                    throw e;
                }
                console.log(e);
                throw "SEARCH_ERROR";
            }
        }

        if (this.queue.filter(item => item.videoInfo.video_id == videoInfo.video_id).length > 0) {
            throw "DUPLICATE_ENTRY";
        }

        //Push new video onto queue
        const newItem = new QueueItem(requestedBy, videoInfo);
        this.queue.push(newItem);

        //Return the found video
        return newItem;
    }

}

class MusicManager {

    queue : MusicQueue;
    idlePlaylist : Array < QueueItem >;
    activeStream :
        ? StreamDispatcher;
    activeConnection :
        ? VoiceConnection;
    activeVoiceChannel :
        ? VoiceChannel;
    activeItem :
        ? QueueItem;
    nowPlayingMessage :
        ? Message;
    controlChannel :
        ? TextChannel;

    constructor(voiceChannel : string, controlChannel :
        ? string) {
        //Initialize defaults
        this.queue = new MusicQueue(Config.MUSIC_MAX_QUEUE_SIZE || 10, this);

        //Bind methods
        this.skip = this.skip.bind(this);
        this.play = this.play.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.handleStreamEnd = this.handleStreamEnd.bind(this);

        (async() => {
            //Connect to voice channels when discord is ready
            DiscordUtils.client.on('ready', async() => {
                //Load idle playlist
                this.idlePlaylist = await Promise.all((Config.MUSIC_IDLE_PLAYLIST || []).map(async(url) => {
                    return new QueueItem("", await yt.getInfo(url));
                }));

                //Reference control channel
                this.controlChannel = (controlChannel)
                    ? DiscordUtils.getTextChannel(controlChannel)
                    : null;

                //Reference voice channel
                this.activeVoiceChannel = DiscordUtils.getVoiceChannel(voiceChannel);
                if (!this.activeVoiceChannel) {
                    console.log("Cannot start music functionality. Configured voice channel does not exist.");
                    return;
                }

                //Join voice channel
                this.activeConnection = (this.activeVoiceChannel)
                    ? await this.activeVoiceChannel.join()
                    : null;

                //Start music
                this.skip();

                //Reconnect when connection lost
                if (this.activeConnection) {
                    this.activeConnection.on('disconnect', async() => {
                        this.activeConnection = (this.activeVoiceChannel)
                            ? await this.activeVoiceChannel.join()
                            : null;
                    });
                }
            });
        })();
    }

    play : Function;

    async play(query : string, requestedBy : string) {
        //Calculate seconds remaining before playing
        let eta = this.queue.getArray().reduce((tot, val) => tot + Number(val.videoInfo.length_seconds), 0) + ((this.activeItem)
            ? Number(this.activeItem.videoInfo.length_seconds) - Math.floor((this.activeStream
                ? this.activeStream.totalStreamTime
                : 0) / 1000)
            : 0);

        //Return info
        return {
            queueItem: await this.queue.push(query, requestedBy),
            queuePosition: this.queue.size(),
            eta: this.secondsToTimestamp(eta)
        };
    }

    secondsToTimestamp : Function;

    secondsToTimestamp(value : number) : string {
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

    skip : Function;

    async skip() {
        //End currently active stream if it exists
        if (this.activeStream) {
            this.activeStream.end('skipMusic');
        }

        //Get next item on the queue, or an item from the idle playlist
        const nextItem : QueueItem = this.queue.pop() || _.sample((this.idlePlaylist.length == 1 || !this.activeItem)
            ? this.idlePlaylist
            : this.idlePlaylist.filter(item => item.videoInfo.video_id != (this.activeItem
                ? this.activeItem.videoInfo.video_id
                : "")));

        //If there's nothing to play, just don't play anything.
        if (!nextItem) {
            DiscordUtils.setPlaying(await DiscordUtils.getPlaying());
            return false;
        }

        //Register current item
        this.activeItem = nextItem;

        //Play the next item on stream
        if (this.activeConnection != null) {
            this.activeStream = this.activeConnection.playStream(yt.stream(nextItem.videoInfo, {filter: 'audioonly'}));
            this.activeStream.on('end', (reason : string) => {
                this.handleStreamEnd(reason);
            });
            DiscordUtils.setPlaying(this.activeItem
                ? this.activeItem.videoInfo.title
                : "Unknown Number");

            //Update now-playing message
            if (this.controlChannel && this.activeItem) {
                const newMessage = "Now playing in **" + this.controlChannel.name + "**: **" + this.activeItem.videoInfo.title + "**";
                if (!this.nowPlayingMessage || this.nowPlayingMessage.id != this.controlChannel.lastMessageID) {
                    this.nowPlayingMessage = await this.controlChannel.send(newMessage);
                } else {
                    this.nowPlayingMessage = await this.nowPlayingMessage.edit(newMessage);
                }
            }

        }

        return true;
    }

    handleStreamEnd : Function;

    handleStreamEnd(reason : string) {
        //Only automatically skip if caused by a graceful stream end
        if (reason != 'skipMusic') {
            this.skip();
        }
    }

    getStatus : Function;

    getStatus() {
        return {
            currentProgress: Math.floor((this.activeStream
                ? this.activeStream.totalStreamTime
                : 0) / 1000),
            currentItem: this.activeItem,
            queue: this.queue.getArray()
        };
    }

};

export default(Config.MUSIC_VOICE_CHANNEL
    ? new MusicManager(Config.MUSIC_VOICE_CHANNEL, Config.MUSIC_CONTROL_CHANNEL)
    : null);
