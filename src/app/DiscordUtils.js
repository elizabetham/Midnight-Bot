'use strict';
let config = require('../config.js');

let DiscordUtils = function () {

    //Initialize fields
    const Discord = require('discord.js');
    this.client = new Discord.Client();

    //Functions
    this.getTextChannel = (guild, name) => {
        return new Promise(resolve => {
            resolve(guild.channels.array().find(c => c.type == 'text' && c.name == name));
        });
    };

    this.getRole = (guild, rolename) => {
        return new Promise(resolve => {
            resolve(guild.roles.array().find(r => r.name == rolename));
        });
    };

    this.start = async() => {
        return await this.client.login(config.botToken);
    }
};

module.exports = new DiscordUtils();