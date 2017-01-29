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
import {PERMISSION_PRESETS} from '../utils/Permission';
import {Redis} from '../utils/DBManager';
import moment from 'moment';

class MusicManager {

    //Fields
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
    votes : Map < string,
    boolean >; //<UID,VoteType : boolean>

    constructor(voiceChannel : string, controlChannel :
        ? string) {
        //Initialize defaults
        this.queue = new MusicQueue(Config.MUSIC_MAX_QUEUE_SIZE || 20, this);
        this.votes = new Map();

        //Bind methods
        this.skip = this.skip.bind(this);
        this.play = this.play.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.handleStreamEnd = this.handleStreamEnd.bind(this);
        this.upvote = this.upvote.bind(this);
        this.downvote = this.downvote.bind(this);
        this.vote = this.vote.bind(this);
        this.purgeVotes = this.purgeVotes.bind(this);

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
    async upvote(user : GuildMember) {
        await this.vote(user, true);
    }

    downvote : Function;
    async downvote(user : GuildMember) {
        await this.vote(user, false);
    }

    vote : Function;
    async vote(user : GuildMember, type : boolean) {
        //Prevent double voting
        if (this.votes.has(user.id)) {
            throw {e: "ALREADY_VOTED"};
        }

        //Only allow listeners to vote
        if (!this.activeVoiceChannel || user.voiceChannelID != this.activeVoiceChannel.id) {
            throw {e: "NOT_LISTENING"};
        }

        //Apply vote
        this.votes.set(user.id, type);

        //Purge votes from users who left
        await this.purgeVotes();
    }

    purgeVotes : Function;

    async purgeVotes() {
        await Promise.all(Array.from(this.votes.keys()).map(async(key) => {
            if (this.activeVoiceChannel) {
                let member = await this.activeVoiceChannel.guild.fetchMember(key);
                if (this.activeVoiceChannel && (!member || member.voiceChannelID != this.activeVoiceChannel.id)) {
                    this.votes.delete(key);
                }
            }
        }));
    }

    play : Function;

    async play(query : string, member : GuildMember) {
        //Check if user is allowed another queue
        const currentlyQueued = this.queue.getArray().filter(i => i.requestedBy == member.id).length;
        const allowedQueues = ([
            [
                PERMISSION_PRESETS.CONVICTS.MODERATOR, 5
            ],
            [PERMISSION_PRESETS.CONVICTS.SILVER_SOULS, 3]
        ].find(lvl => DiscordUtils.hasPermission(member, lvl[0].getRole(), true)) || [null, 1])[1];
        if (currentlyQueued >= allowedQueues) {
            throw {e: "MAX_ALLOWED_QUEUES", allowed: allowedQueues};
        }

        //Check if user is on cooldown
        const requiredCooldown = ([
            [
                PERMISSION_PRESETS.CONVICTS.MODERATOR, 0
            ],
            [
                PERMISSION_PRESETS.CONVICTS.SILVER_SOULS, 8 * 60
            ]
        ].find(lvl => DiscordUtils.hasPermission(member, lvl[0].getRole(), true)) || [
            null, 15 * 60
        ])[1];

        let redisKey = member.id + ":MusicQueueCooldown";
        let res = await Redis.existsAsync(redisKey);
        if (res) {
            Redis.get(redisKey);
            let data = await Redis.getAsync(redisKey);
            throw {
                e: "USER_QUEUE_COOLDOWN",
                timeRemaining: this.secondsToTimestamp(data - moment().unix())
            };
        }

        //Calculate seconds remaining before playing
        let eta = this.queue.getArray().reduce((tot, val) => tot + Number(val.videoInfo.length_seconds), 0) + ((this.activeItem)
            ? Number(this.activeItem.videoInfo.length_seconds) - Math.floor((this.activeStream
                ? this.activeStream.totalStreamTime
                : 0) / 1000)
            : 0);

        //Return info
        let response = {
            queueItem: await this.queue.push(query, member.id),
            queuePosition: this.queue.size(),
            eta: this.secondsToTimestamp(eta)
        };

        //Update Redis cooldowns
        if (requiredCooldown > 0) {
            Redis.set(redisKey, (moment().unix() + requiredCooldown));
            Redis.expire(redisKey, requiredCooldown);
        }

        //Return info
        return response;
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

        //Reset votes
        this.votes.clear();

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
