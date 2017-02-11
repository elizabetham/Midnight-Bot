// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import DiscordUtils from '../../../utils/DiscordUtils';
import MusicManager from '../../../music/MusicManager';

class GameCommand extends AbstractCommand {

    constructor() {
        super("game", [
            PERMISSION_PRESETS.CONVICTS.MASTER_MODS, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "[status]", "Set Midnight's game status");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "It is not possible to set my game status while the music module is active!", 5000, msg);
            return;
        }

        //Respond
        this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Setting play status...", 5000, msg);

        //Set playing status
        DiscordUtils.setPlaying(args.join(" "), true);
    };

}

export default new GameCommand();
