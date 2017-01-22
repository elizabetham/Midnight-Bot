// @flow

import AbstractCommand from '../AbstractCommand';
import {PERMISSION_PRESETS} from '../Permission';
import {Message, Role} from 'discord.js';
import Lang from '../Lang';
import _ from 'lodash';

class RestartCommand extends AbstractCommand {

    constructor() {
        super("restart", [PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.EVERYONE]);
    }

    exec(args : Array < string >, rawMessage : Message) {
        rawMessage.reply(_.sample(Lang.AFFIRMATIVE) + " I'll be right back.");
        setTimeout(() => {
            process.exit();
        }, 1000);
    };

}

export default new RestartCommand();
