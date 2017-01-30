// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';

class SkipCommand extends AbstractCommand {

    constructor() {
        super("skip", [
            PERMISSION_PRESETS.CONVICTS.PLATINUM_PEEPS, PERMISSION_PRESETS.BOTDEV.MODERATOR
        ], "", "Skip the currently playing track");
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        await msg.delete();

        const skipped : boolean = await MusicManager.skip();
        this.tools.volatileReply(reply, skipped
            ? _.sample(Lang.AFFIRMATIVE) + " Skipping..."
            : "There is no song to play next!", 5000, msg);

    };

}

export default new SkipCommand();
