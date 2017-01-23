// @flow

import Config from '../../config';
import {Client, Guild} from 'discord.js';
import {Redis} from './DBManager';

class DiscordUtils {

    client : Client;
    start : Function;
    stop : Function;
    getPlaying : () => Promise < string >;
    setPlaying : (game : string, save
        ?
        : boolean) => Promise < void >;

    //Constructor
    constructor() {
        this.client = new Client();
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.getPlaying = this.getPlaying.bind(this);
        this.setPlaying = this.setPlaying.bind(this);
    }

    //Functions
    getTextChannel(guild : Guild, name : string) {
        return new Promise(resolve => {
            resolve(guild.channels.array().find(c => c.type == 'text' && c.name == name));
        });
    };

    getRole(guild : Guild, rolename : string) {
        return new Promise(resolve => {
            resolve(guild.roles.array().find(r => r.name == rolename));
        });
    };

    async start() {
        if (!this.client)
            this.client = new Client();
        return await this.client.login(Config.botToken);
    }

    async stop() {
        return await this.client.destroy();
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
            let res = await Redis.existsAsync("bot:game");
            if (!res) {
                Redis.set("bot:game", game);
            }
        }
        this.client.user.setGame(game);
    }
}

export default new DiscordUtils();
