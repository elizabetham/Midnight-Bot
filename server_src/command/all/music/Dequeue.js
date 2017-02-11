// @flow

import AbstractCommand from '../../AbstractCommand';
import {PERMISSION_PRESETS} from '../../../utils/Permission';
import {Message, GuildMember} from 'discord.js';
import Lang from '../../Lang';
import _ from 'lodash';
import MusicManager from '../../../music/MusicManager';
import DiscordUtils from '../../../utils/DiscordUtils';
import Config from '../../../../config';

class DequeueCommand extends AbstractCommand {

    constructor() {
        super("dequeue", [
            PERMISSION_PRESETS.CONVICTS.EVERYONE, PERMISSION_PRESETS.BOTDEV.EVERYONE
        ], "[#|all]", "Remove a specific- or your last queued track from the queue.", ["unqueue"]);
    }

    async exec(args : Array < string >, reply : (msg : string) => Promise < Message >, user : GuildMember, msg : Message) {
        if (!MusicManager) {
            this.tools.volatileReply(reply, "My music module is currently not enabled!", 5000, msg);
            return;
        }

        if (msg.channel.id != Config.MUSIC_CONTROL_CHANNEL) {
            msg.delete().catch(e => {});
            return;
        }

        //
        //Moderation removal
        //
        if (args.length > 0) {
            //Deny permission for non mods
            if (!DiscordUtils.hasPermission(user, PERMISSION_PRESETS.CONVICTS.MODERATOR.getRole(), true) && !DiscordUtils.hasPermission(user, PERMISSION_PRESETS.BOTDEV.MODERATOR.getRole(), true)) {
                this.tools.volatileReply(reply, _.sample(Lang.NO_PERMISSION), 5000, msg);
                return;
            }

            if (args[0].toLowerCase() == "all") {
                MusicManager.queue.purge();
                this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " Queue purged.", 5000, msg);
                return;
            }

            //Check if number
            if (isNaN(args[0])) {
                this.tools.volatileReply(reply, "`" + args[0] + "` is not a valid queue index. Please use a valid number.", 5000, msg);
                return;
            }

            const index = parseInt(args[0]) - 1;

            //Check if it's a valid reference
            if (index < 0 || parseInt(args[0]) >= MusicManager.queue.getQueue().length) {
                this.tools.volatileReply(reply, "`" + args[0] + "` does not match any item on the queue. Please use a number on the queue.", 5000, msg);
                return;
            }

            //Remove item at index from queue
            let removedTrack = MusicManager.queue.removeAtIndex(index);

            if (removedTrack) {
                this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " **" + removedTrack.videoInfo.title + "** has been removed from the queue!", 5000, msg);
            }
            return;
        }

        //
        //Dequeue last personally queued track
        //

        //Find last queued track
        let track = MusicManager.queue.getQueue().slice().reverse().find(item => item.requestedBy == user.id);

        //If not found quit here
        if (!track) {
            this.tools.volatileReply(reply, "You have no tracks queued, there's nothing to dequeue.", 5000, msg);
            return;
        }

        //Remove it from the queue
        let removedTrack = MusicManager.queue.removeAtIndex(MusicManager.queue.getQueue().indexOf(track));

        //Let the user know of success
        if (removedTrack) {
            this.tools.volatileReply(reply, _.sample(Lang.AFFIRMATIVE) + " **" + removedTrack.videoInfo.title + "** has been removed from the queue!", 5000, msg);
        }
    };

}

export default new DequeueCommand();
