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
import {Redis, UserRecord} from '../utils/DBManager';
import moment from 'moment';
import UserUtils from '../utils/UserUtils';
import ordinal from 'ordinal-number-suffix';

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

    //Flow protection variables
    skipped : boolean;

    constructor(voiceChannel : string, controlChannel :
        ? string) {
        //Initialize defaults
        this.queue = new MusicQueue(Config.MUSIC_MAX_QUEUE_SIZE || 20, this);
        this.votes = new Map();
        this.skipped = false;

        //Bind methods
        this.skip = this.skip.bind(this);
        this.play = this.play.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.handleStreamEnd = this.handleStreamEnd.bind(this);
        this.upvote = this.upvote.bind(this);
        this.downvote = this.downvote.bind(this);
        this.vote = this.vote.bind(this);
        this.processVoteEffects = this.processVoteEffects.bind(this);
        this.setShamePoints = this.setShamePoints.bind(this);
        this.getShamePoints = this.getShamePoints.bind(this);
        this.incrShamePoints = this.incrShamePoints.bind(this);

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

    setShamePoints : Function;
    async setShamePoints(userid : string, value : number) {
        const key = userid + ":MusicShamePoints";
        Redis.set(key, value);
        Redis.expire(key, 3600 * 2 * value);
        return value;
    }
    getShamePoints : Function;
    async getShamePoints(userid : string) {
        const key = userid + ":MusicShamePoints";
        let res = await Redis.existsAsync(key);
        return res
            ? await Redis.getAsync(key)
            : 0;
    }
    incrShamePoints : Function;
    async incrShamePoints(userid : string) {
        const key = userid + ":MusicShamePoints";

        //Create key if it does not exist yet
        let res = await Redis.existsAsync(key);
        if (!res) {
            Redis.set(key, 0);
        }

        //Increment points
        const value = Redis.incr(key);
        Redis.expire(key, 3600 * 2 * value);
        return value;
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

        //Process vote effects
        await this.processVoteEffects("VOTE");
    }

    processVoteEffects : Function;

    async processVoteEffects(event : string) {
        //First purge all the votes from users who left
        await Promise.all(Array.from(this.votes.keys()).map(async(key) => {
            if (this.activeVoiceChannel) {
                let member = await this.activeVoiceChannel.guild.fetchMember(key);
                if (this.activeVoiceChannel && (!member || member.voiceChannelID != this.activeVoiceChannel.id)) {
                    this.votes.delete(key);
                }
            }
        }));

        const votes = Array.from(this.votes.values()).length;

        //No vote effects below a threshold of 5
        if (votes < 5) {
            return;
        }

        const downvotes = Array.from(this.votes.values()).filter(vote => !vote).length;
        const upvotes = Array.from(this.votes.values()).filter(vote => vote).length;

        //25% negativity threshold;
        if (downvotes / votes >= 0.25 && downvotes >= 5 && !this.skipped && event != "SONG_END") {
            //Block flow for effect
            this.skipped = true;

            //Increase shame points for current DJ. Block access for 24hr if they've gained too many.
            let djBlocked = false;
            let shamePoints = this.activeItem
                ? this.incrShamePoints(this.activeItem.requestedBy)
                : 0;
            if (this.activeItem && shamePoints >= 3) {
                let key = this.activeItem.requestedBy + ":MusicQueueCooldown";
                let cooldown = 3600 * 24;
                Redis.set(key, (moment().unix() + cooldown));
                Redis.expire(key, cooldown);
                djBlocked = true;
            }

            //Blacklist the song for 24 hours
            if (this.activeItem) {
                let key = this.activeItem.videoInfo.video_id + ":MusicTmpBlacklist";
                let cooldown = 3600 * 24;
                Redis.set(key, (moment().unix() + cooldown));
                Redis.expire(key, cooldown);
            }

            //Send message
            if (this.activeItem) {
                let msg = "Skipped **" + this.activeItem.videoInfo.title + "** because of too many downvotes. <@" + this.activeItem.requestedBy + "> now has **" + shamePoints + "** shame points." + (djBlocked
                    ? " They've been put on a 24 hour DJ cooldown."
                    : "");
                if (this.controlChannel) {
                    this.controlChannel.sendMessage(msg);
                }
            }

            //Skip the current song
            this.skip();
        }

        //Song end
        if (event == "SONG_END" && this.activeItem) {
            let msg = "<@" + this.activeItem.requestedBy + ">" + ", Your track ended with **" + upvotes + "**:thumbsup:/**" + downvotes + "**:thumbsdown:.";
            if (upvotes / votes >= 0.75 && upvotes >= 5) {

                //Save award point
                const record = UserUtils.assertUserRecord(this.activeItem.requestedBy);
                record.djAwardPoints = record.djAwardPoints
                    ? record.djAwardPoints + 1
                    : 1;
                await record.save();

                //Obtain placement
                let found = false;
                let placement = UserRecord.find({
                    djAwardsPoints: {
                        $gt: 0
                    }
                }).sort({djAwardsPoints: 1, username: 1}).lean().filter((r, index) => {
                    if (r.userid == record.userid) {
                        found = true;
                    }
                    return found;
                }).length();

                //Add to message
                msg += " You have been given an award point! You now have **" + record.djAwardsPoints + "** points, putting you in the **" + ordinal(placement) + "** position on the leaderboards!";
            }
            if (this.controlChannel) {
                this.controlChannel.sendMessage(msg);
            }
        }

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

        //Process vote effects
        await this.processVoteEffects("SONG_END");

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

        //Reset flow variables
        this.skipped = false;

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
