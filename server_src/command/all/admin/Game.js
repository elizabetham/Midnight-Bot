// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import DiscordUtils from '../../../utils/DiscordUtils';

class GameCommand extends AbstractCommand {

    constructor() {
        super("game", [
            PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "[status]", "Set Midnight's game status");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        //Respond
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Setting play status...", 5000, msg);

        //Set playing status
        DiscordUtils.setPlaying(args.join(" "), true);
    };

}

export default new GameCommand();
