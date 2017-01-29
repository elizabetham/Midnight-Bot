// @flow

import Config from '../../config';
import type {
    StreamDispatcher,
    VoiceConnection,
    VoiceChannel,
    Message,
    TextChannel,
    User,
    GuildMember
}
from 'discord.js';
import _ from 'lodash';
import DiscordUtils from '../utils/DiscordUtils';
import QueueItem from './QueueItem';
import MusicQueue from './MusicQueue';
import {yt} from './MusicTools';

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
        this.queue = new MusicQueue(Config.MUSIC_MAX_QUEUE_SIZE || 20, this);

        //Bind methods
        this.skip = this.skip.bind(this);
        this.play = this.play.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.handleStreamEnd = this.handleStreamEnd.bind(this);
        this.upvote = this.upvote.bind(this);
        this.downvote = this.downvote.bind(this);
        this.vote = this.vote.bind(this);

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

    upvote : Function;
    upvote(user : GuildMember) {
        this.vote(user, true);
    }

    downvote : Function;
    downvote(user : GuildMember) {
        this.vote(user, false);
    }

    vote : Function;
    vote(user : GuildMember, type : boolean) {}

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
