// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../Lang';
import _ from 'lodash';

class PlayingCommand extends AbstractCommand {

    constructor() {
        super("playing", [PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise<Message>, user : GuildMember, msg : Message) {
        //Respond
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Setting play status...", 5000, msg);

        //Set playing status
        msg.client.user.setGame(args.join(" "));
    };

}

export default new PlayingCommand();
