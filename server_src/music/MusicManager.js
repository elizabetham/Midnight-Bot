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
import {yt, secondsToTimestamp} from './MusicTools';
import {PERMISSION_PRESETS} from '../utils/Permission';
import {Redis, UserRecord, BlacklistedVideo, GenericEvent as GenericEventRecord} from '../utils/DBManager';
import moment from 'moment';
import UserUtils from '../utils/UserUtils';
import ordinal from 'ordinal-number-suffix';
import Logging from '../utils/Logging';
import GenericEvent from '../datatypes/GenericEvent';

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
    lastNowPlayingUpdate : number;
    scheduledNowPlayingUpdate : boolean;
    trackStartedAt : number;

    //Flow protection variables
    skipped : boolean;

    constructor(voiceChannel : string, controlChannel :
        ? string) {

        //Initialize defaults
        this.queue = new MusicQueue(Config.MUSIC_MAX_QUEUE_SIZE || 20, this);
        this.votes = new Map();
        this.skipped = false;
        this.trackStartedAt = 0;
        this.lastNowPlayingUpdate = 0;
        this.scheduledNowPlayingUpdate = false;

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
        this.updateNowPlaying = this.updateNowPlaying.bind(this);
        this.unblacklistVideo = this.unblacklistVideo.bind(this);
        this.blacklistVideo = this.blacklistVideo.bind(this);
        this.checkPermBlacklist = this.checkPermBlacklist.bind(this);
        this.addToIdlePlaylist = this.addToIdlePlaylist.bind(this);
        this.getListeners = this.getListeners.bind(this);

        (async() => {

            //Connect to voice channels when discord is ready
            DiscordUtils.client.once('ready', async() => {

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

                //Load idle playlist
                this.idlePlaylist = [];
                if (Config.MUSIC_IDLE_PLAYLIST) {
                    let urls = _.shuffle(Config.MUSIC_IDLE_PLAYLIST.slice(0));
                    (function load(i, start) {
                        setTimeout((async function() {
                            if (i > 0) {
                                try {
                                    this.addToIdlePlaylist(new QueueItem("", await yt.getInfo(urls[i])));
                                    if (start) {
                                        await this.skip("KICKSTART");
                                    }
                                } catch (e) {
                                    console.log("ATTEMPTED RESOLVE", urls[i], e);
                                }
                                if (--i)
                                    load.bind(this)(i, false);
                                }
                            }).bind(this), start
                            ? 0
                            : 2000);
                    }).bind(this)(urls.length - 1, true);
                } else {
                    this.skip("KICKSTART");
                }

                //Reconnect when connection lost
                if (this.activeConnection) {
                    this.activeConnection.on('disconnect', async() => {
                        this.activeConnection = (this.activeVoiceChannel)
                            ? await this.activeVoiceChannel.join()
                            : null;
                        if (this.activeConnection) {
                            Logging.warning("VOICE_RECONNECT", "Voice disconnected unexpectedly. Voice recovery succeeded");
                        } else {
                            Logging.error("VOICE_RECONNECT", "Voice disconnected unexpectedly. Voice recovery failed!");
                            return;
                        }
                        await this.skip("VOICE_RECONNECT");
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
        //Increment points
        const key = userid + ":MusicShamePoints";
        const value = await Redis.incrAsync(key);
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
    async vote(member : GuildMember, type : boolean) {
        //Prevent double voting
        if (this.votes.has(member.id)) {
            throw {e: "ALREADY_VOTED"};
        }

        //Only allow listeners to vote
        if (!this.activeVoiceChannel || member.voiceChannelID != this.activeVoiceChannel.id || member.deaf) {
            throw {e: "NOT_LISTENING"};
        }

        //Dont vote when there's nothing playing
        if (!this.activeItem) {
            throw {e: "NO_ACTIVE_SONG"};
        }

        //Prevent voting for self
        if (this.activeItem.requestedBy == member.id) {
            throw {e: "SELF_VOTE"};
        }

        //Only allow voting after 10 seconds into the song
        const enableVotingAfter = 10;
        if (moment().unix() - this.trackStartedAt < enableVotingAfter) {
            throw {
                e: "NO_VOTING_YET",
                set: enableVotingAfter,
                wait: enableVotingAfter + this.trackStartedAt - moment().unix()
            };
        }

        //Apply vote
        this.votes.set(member.id, type);

        //Process vote effects
        await this.processVoteEffects("VOTE");

        //Redraw vote data
        await this.updateNowPlaying();
    }

    getListeners : () => Array < GuildMember >;

    getListeners() : Array < GuildMember > {
        return this.activeVoiceChannel
            ? this.activeVoiceChannel.members.array().filter(member => !member.deaf && !member.user.bot)
            : [];
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
        const downvotes = Array.from(this.votes.values()).filter(vote => !vote).length;
        const upvotes = Array.from(this.votes.values()).filter(vote => vote).length;
        const listeners = this.getListeners().length;

        //Negativity threshold;
        if (downvotes / listeners >= 0.40 && votes >= 5 && !this.skipped && event != "SONG_END") {
            //Block flow for effect
            this.skipped = true;

            //Increase shame points for current DJ. Block access for 24hr if they've gained too many.
            let djBlocked = false;
            let shamePoints = this.activeItem
                ? await this.incrShamePoints(this.activeItem.requestedBy)
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

            //Blacklist it permanently if skipped >= 3 times
            let blacklisted = false;
            if (this.activeItem) {
                let key = this.activeItem.videoInfo.video_id + ":MusicVoteSkipped";
                let skipped = await Redis.incrAsync(key);
                if (skipped >= 3) {
                    blacklisted = true;
                    try {
                        this.blacklistVideo(key);
                    } catch (e) {
                        if (e.e != "ALREADY_BLACKLISTED") {
                            throw e;
                        }
                    }
                }
            }

            //Log event
            if (this.activeItem) {
                new GenericEvent("TRACK_VOTESKIP").setData({
                    videoId: this.activeItem.videoInfo.video_id,
                    requestedBy: this.activeItem.requestedBy || undefined,
                    downvotes: downvotes,
                    blacklisted: blacklisted
                }).save();
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
            await this.skip("VOTESKIP");
            this.skipped = false;
        }

        //Song end
        if (event == "SONG_END" && this.activeItem) {
            let videoInfo = this.activeItem.videoInfo;
            let requestedBy = this.activeItem.requestedBy;
            if (requestedBy) {
                let msg = "<@" + requestedBy + ">" + ", Your track ended with **" + upvotes + "**:thumbsup: **" + downvotes + "**:thumbsdown:.";
                if (upvotes / votes >= 0.75 && votes >= 5) {
                    new GenericEvent("GET_AWARD_POINT").setInitiator(requestedBy).save();
                    try {
                        msg += " You have received an award point! You now have " + (await GenericEventRecord.count({eventType: "GET_AWARD_POINT", initiatorUID: requestedBy})) + "** award points!";
                    } catch (err) {
                        Logging.error("AWARD_POINT_COUNT", err);
                    }
                }
                if (this.controlChannel) {
                    let message = await this.controlChannel.sendMessage(msg);
                    if (votes < 5) {
                        message.delete(10000).catch(e => {});
                    }
                }
            }

            Array.from(this.votes.entries()).forEach(entry => {
                new GenericEvent(entry[1]
                    ? "TRACK_UPVOTE"
                    : "TRACK_DOWNVOTE").setInitiator(entry[0]).setData({videoId: videoInfo.video_id, requestedBy: requestedBy}).save();
            });
        }
    }

    play : Function;

    async play(query : string, member : GuildMember) {

        let redisKey = member.id + ":MusicQueueCooldown";
        let res = await Redis.existsAsync(redisKey);
        if (res) {
            Redis.get(redisKey);
            let data = await Redis.getAsync(redisKey);
            throw {
                e: "USER_QUEUE_COOLDOWN",
                timeRemaining: secondsToTimestamp(data - moment().unix())
            };
        }

        //Check if user is allowed another queue
        const currentlyQueued = this.queue.getQueue().filter(i => i.requestedBy == member.id).length;
        const allowedQueues = ([
            [
                PERMISSION_PRESETS.CONVICTS.MODERATOR, 5
            ],
            [
                PERMISSION_PRESETS.BOTDEV.MODERATOR, 5
            ],
            [
                PERMISSION_PRESETS.CONVICTS.TWITCH_SUBSCRIBER, 3
            ],
            [PERMISSION_PRESETS.BOTDEV.SILVER_SOULS, 3]
        ].find(lvl => {
            return lvl[0].getRole() && DiscordUtils.hasPermission(member, lvl[0].getRole(), true);
        }) || [null, 1])[1];
        if (currentlyQueued >= allowedQueues) {
            throw {e: "MAX_ALLOWED_QUEUES", allowed: allowedQueues};
        }

        //Calculate seconds remaining before playing
        let eta = this.queue.getQueue().reduce((tot, val) => tot + parseInt(val.videoInfo.length_seconds), 0) + ((this.activeItem)
            ? parseInt(this.activeItem.videoInfo.length_seconds) - Math.floor((this.activeStream
                ? this.activeStream.totalStreamTime
                : 0) / 1000)
            : 0);

        //Construct return info
        let response = {
            queueItem: await this.queue.push(query, member.id),
            queuePosition: this.queue.size(),
            eta: secondsToTimestamp(eta)
        };

        //Check if user should receive
        const requiredCooldown = ([
            [
                PERMISSION_PRESETS.CONVICTS.MODERATOR, 0
            ],
            [
                PERMISSION_PRESETS.BOTDEV.MODERATOR, 0
            ],
            [
                PERMISSION_PRESETS.CONVICTS.TWITCH_SUBSCRIBER, 2 * 60
            ],
            [
                PERMISSION_PRESETS.BOTDEV.SILVER_SOULS, 2 * 60
            ]
        ].find(lvl => lvl[0].getRole() && DiscordUtils.hasPermission(member, lvl[0].getRole(), true)) || [
            null, 5 * 60
        ])[1];

        //Update Redis cooldowns
        if (requiredCooldown > 0) {
            Redis.set(redisKey, (moment().unix() + requiredCooldown));
            Redis.expire(redisKey, requiredCooldown);
        }

        //Start playing if there's nothing else active
        if (!this.activeItem) {
            this.skip("AUTOSTART");
        }

        //Return info
        return response;
    }

    addToIdlePlaylist : Function;

    addToIdlePlaylist(queueItem : QueueItem) {
        this.idlePlaylist.push(queueItem);
    }

    skip : Function;

    async skip(origin : string) {

        //Flood protection
        if (origin != "CMD" && origin != "QUEUED_BY_NON_LISTENER") {
            let count = await Redis.incrAsync("MUSIC_SKIP_FLOOD");
            await Redis.expireAsync("MUSIC_SKIP_FLOOD", 2);
            if (count >= 10) {
                Logging.error("SKIP_LOOP");
                if (this.controlChannel) {
                    this.controlChannel.sendMessage("An internal error occurred, please contact a staff member!");
                }
                return false;
            }
        }

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

        //Skip the new song if the requester is not present
        if (nextItem && nextItem.requestedBy) {
            let member = (this.activeVoiceChannel)
                ? await this.activeVoiceChannel.guild.fetchMember(nextItem.requestedBy)
                : null;
            if (this.activeVoiceChannel && member && (member.deaf || member.voiceChannelID != this.activeVoiceChannel.id)) {
                member.sendMessage("Your track **'" + nextItem.videoInfo.title + "'** has been dequeued because you are not currently listening.");
                return await this.skip("QUEUED_BY_NON_LISTENER");
            }
        }

        //Process vote effects
        await this.processVoteEffects("SONG_END");

        //If there's nothing to play, just don't play anything.
        if (!nextItem) {
            DiscordUtils.setPlaying(await DiscordUtils.getPlaying());
            if (this.nowPlayingMessage) {
                this.nowPlayingMessage.delete().catch(e => {});
            }
            this.activeItem = null;
            this.activeStream = null;
            return;
        }

        //Register current item
        this.activeItem = nextItem;

        //Reset votes
        this.votes.clear();

        //Download
        let musicFile;
        try {
            musicFile = await Promise.race([
                nextItem.download(),
                new Promise((resolve, reject) => {
                    setTimeout(() => resolve("TIMEOUT"), 10000)
                })
            ]);
            if (musicFile == "TIMEOUT") {
                if (this.controlChannel) {
                    (await this.controlChannel.sendMessage("**" + nextItem.videoInfo.title + "** could not be played as it took too long to download.")).delete(5000);
                }
                return await this.skip("PREVIOUS_TRACK_FAILED");
            }
        } catch (e) {
            //Log download error
            Logging.error("YTDL_FAILED", e);

            //Tell members song could not be played
            if (this.controlChannel) {
                (await this.controlChannel.sendMessage("**" + nextItem.videoInfo.title + "** could not be played as it could not be downloaded.")).delete(5000);
            }

            //If the song is on the default playlist, let staff know to check it
            if (this.idlePlaylist.find(item => item.videoInfo.video_id == nextItem.videoInfo.video_id)) {
                Logging.bot("The following song on the default playlist is unaccessible. It is advised to manually check if it's still supported: **'" + nextItem.videoInfo.title + "'** https://www.youtube.com/watch?v=" + nextItem.videoInfo.video_id);
            }

            //Attempt playing the next track
            return await this.skip("PREVIOUS_TRACK_FAILED");
        }

        //Play the next item on stream
        try {
            if (this.activeConnection != null) {
                this.activeStream = this.activeConnection.playFile(musicFile);
                this.activeStream.on('end', (reason : string) => {
                    this.handleStreamEnd(reason);
                });
                DiscordUtils.setPlaying(this.activeItem
                    ? this.activeItem.videoInfo.title
                    : "Unknown Number");

                //Update now-playing message
                await this.updateNowPlaying();

                //Log play
                if (this.activeItem && this.activeItem.requestedBy) {
                    const activeItem = this.activeItem;
                    new GenericEvent("USER_PLAY_TRACK").setData({videoId: activeItem.videoInfo.video_id}).setInitiator(activeItem.requestedBy).save();
                }

                //Note track start time
                this.trackStartedAt = moment().unix();
            }
        } catch (e) {
            Logging.warning("YT_STREAM_ERROR", {
                e: e,
                item: nextItem
            });
            if (this.controlChannel) {
                (await this.controlChannel.sendMessage("I could not manage to stream the next song!")).delete(5000);
            }
            return await this.skip("STREAM_ERROR_SKIP");
        }
        return true;
    }

    updateNowPlaying : Function;

    async updateNowPlaying() {

        //Prevent spam updates
        if (moment().unix() - this.lastNowPlayingUpdate < 3) {

            //If an update is already scheduled, stop here.
            if (this.scheduledNowPlayingUpdate) {
                return;
            }

            //If no update is scheduled, schedule one.
            this.scheduledNowPlayingUpdate = true;
            setTimeout(() => {
                this.scheduledNowPlayingUpdate = false;
                this.updateNowPlaying();
            }, 3100);
            return;
        }

        //Update
        if (this.controlChannel && this.activeItem) {
            let controlChannel = this.controlChannel;
            let activeItem = this.activeItem;

            //Construct message
            let newMessage = "`Now` **" + activeItem.videoInfo.title + "** added by **" + (activeItem.requestedBy
                ? (await UserUtils.assertUserRecord(activeItem.requestedBy)).username
                : "Midnight") + "**\n";;

            //Playlist
            if (this.queue.getQueue().length > 0) {
                (await Promise.all(this.queue.getQueue().map(async(item, index) => "`" + (index + 1) + ".` **" + item.videoInfo.title + "** added by **" + (item.requestedBy
                    ? (await UserUtils.assertUserRecord(item.requestedBy)).username
                    : "Midnight") + "**\n"))).forEach(line => newMessage += line);
            }

            //Voting info
            const downvotes = Array.from(this.votes.values()).filter(vote => !vote).length;
            const upvotes = Array.from(this.votes.values()).filter(vote => vote).length;
            newMessage += "\nVotes: **" + upvotes + "**:thumbsup: **" + downvotes + "**:thumbsdown: - To vote, use **!upvote** or **!downvote**";

            //If the now playing message doesn't exist or is not the last message anymore, create a new one
            if (!this.nowPlayingMessage || (await controlChannel.fetchMessages({after: this.nowPlayingMessage.id})).array().length > 0) {
                if (this.nowPlayingMessage) {
                    //Delete the message if it existed
                    this.nowPlayingMessage.delete().catch(e => {});
                }
                //Send new message
                this.nowPlayingMessage = await controlChannel.send(newMessage);
            } else {
                //Edit existing message if it's still last.
                this.nowPlayingMessage = await this.nowPlayingMessage.edit(newMessage);
            }
        }
    }

    handleStreamEnd : Function;

    handleStreamEnd(reason : string) {
        //Only automatically skip if caused by a graceful stream end
        if (reason != 'skipMusic') {
            this.skip("SONG_END");
        }
    }

    getStatus : Function;

    getStatus() {
        return {
            currentProgress: Math.floor((this.activeStream
                ? this.activeStream.totalStreamTime
                : 0) / 1000),
            currentItem: this.activeItem,
            queue: this.queue.getQueue()
        };
    }

    unblacklistVideo : Function;

    unblacklistVideo : Function;

    async unblacklistVideo(ytid : string) {
        let res = await this.checkPermBlacklist(ytid);
        if (!res) {
            throw "ALREADY_ALLOWED";
        }
        await res.remove();
    }

    blacklistVideo : Function;

    async blacklistVideo(ytid : string, listedBy :
        ? string) {
        if (await this.checkPermBlacklist(ytid)) {
            throw {e: "ALREADY_BLACKLISTED"};
        }

        let vidModel : {
            ytid : string,
            listedBy?: string
        } = {
            ytid
        };

        if (listedBy) {
            vidModel['listedBy'] = listedBy;
        }

        await new BlacklistedVideo(vidModel).save();
    }

    checkPermBlacklist : Function;

    async checkPermBlacklist(ytid : string) {
        return (await BlacklistedVideo.findOne({ytid: ytid}));
    }

};

export default(Config.MUSIC_VOICE_CHANNEL
    ? new MusicManager(Config.MUSIC_VOICE_CHANNEL, Config.MUSIC_CONTROL_CHANNEL)
    : null);
