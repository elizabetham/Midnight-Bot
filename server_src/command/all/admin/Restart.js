// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';

class RestartCommand extends AbstractCommand {

    constructor() {
        super("restart", [
            PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.MODERATOR, PERMISSION_PRESETS.MAGICANDCHILL.MODS
        ], "", "Make Midnight restart herself.");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " I'll be right back.", 5000, msg);
        setTimeout(() => {
            process.exit();
        }, 1000);
    };

}

export default new RestartCommand();
