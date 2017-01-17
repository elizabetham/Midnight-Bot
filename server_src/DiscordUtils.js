// @flow

import Config from '../config';
import {Client, Guild} from 'discord.js';

class DiscordUtils {

    client : Client;
    start : Function;
    stop : Function;

    //Constructor
    constructor() {
        this.client = new Client();
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
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

}

export default new DiscordUtils();
