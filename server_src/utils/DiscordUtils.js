// @flow

import Config from '../../config';
import type {Guild, VoiceChannel, TextChannel, GuildMember, Role}
from 'discord.js';
import {Client} from 'discord.js';
import {Redis} from './DBManager';
import _ from 'lodash';

class DiscordUtils {

    client : Client;
    start : Function;
    stop : Function;
    getPlaying : () => Promise < string >;
    setPlaying : (game : string, save
        ?
        : boolean) => Promise < void >;
    getVoiceChannel : (id : string) => VoiceChannel;
    getTextChannel : (id : string) => TextChannel;
    hasPermission : (user : GuildMember, minRole : Role, inclusive
        ?
        : boolean) => boolean;
    getRoleById : (id : string) => Role;

    //Constructor
    constructor() {
        this.client = new Client();
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.getPlaying = this.getPlaying.bind(this);
        this.setPlaying = this.setPlaying.bind(this);
        this.getVoiceChannel = this.getVoiceChannel.bind(this);
        this.getTextChannel = this.getTextChannel.bind(this);
        this.getRoleById = this.getRoleById.bind(this);
    }

    //Functions
    getTextChannelByName(guild : Guild, name : string) {
        return new Promise(resolve => {
            resolve(guild.channels.array().find(c => c.type == 'text' && c.name == name));
        });
    };

    getTextChannel(id : string) {
        return this.client.guilds.array().map(guild => guild.channels.find(channel => channel.type == 'text' && id == channel.id)).find(c => c);
    };

    getVoiceChannel(id : string) {
        return this.client.guilds.array().map(guild => guild.channels.find(channel => channel.type == 'voice' && id == channel.id)).find(c => c);
    };

    getRoleByName(guild : Guild, rolename : string) {
        return new Promise(resolve => {
            resolve(guild.roles.array().find(r => r.name == rolename));
        });
    };

    getRoleById(id : string) {
        return this.client.guilds.array().map(guild => guild.roles.array().find(role => role.id == id)).find(c => c);
    }

    async start() {
        return await this.client.login(Config.botToken);
    }

    async stop() {
        await this.client.destroy();
    }

    async getPlaying() : Promise < string > {
        let res = await Redis.existsAsync("bot:game");
        if (!res) {
            return "";
        }
        return await Redis.getAsync("bot:game");
    }

    async setPlaying(game : string, save?: boolean = true) {
        if (save) {
            Redis.set("bot:game", game);
        }
        this.client.user.setGame(game);
    }

    hasPermission(user : GuildMember, minRole : Role, inclusive : boolean = true) {
        const userpos = _.max(user.roles.array().map(r => r.position));
        return user.roles.array().find(role => role.name.toUpperCase() == "BOTDEV" || (inclusive && userpos >= minRole.position || userpos > minRole.position));
    }
}

export default new DiscordUtils();
