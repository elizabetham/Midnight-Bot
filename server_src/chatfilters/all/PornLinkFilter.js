// @flow

import AbstractLinkFilter from '../AbstractLinkFilter';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../../utils/UserUtils';
import Logging from '../../utils/Logging';
import Infraction from '../../datatypes/Infraction';

class PornLinkFilter extends AbstractLinkFilter {

    constructor() {
        super("Porn Link Filter");
    }

    domains() : Array < string > {
        return [
            "reddit.com/r/rule34",
            "paheal.net",
            "youporn.com",
            "xnxx.com",
            "porn.com",
            "ixxx.com",
            "xvideos.com",
            "cliti.com",
            "fuq.com",
            "alohatube.com",
            "dinotube.com",
            "rule34.xxx",
            "xhamster.com",
            "youjizz.com",
            "hclips.com",
            "tnaflix.com",
            "tube8.com",
            "spankbang.com",
            "theporndude.com",
            "drtuber.com",
            "spankwire.com",
            "keezmovies.com",
            "nuvid.com",
            "sunporno.com",
            "mofosex.com",
            "xxcartoon.com",
            "simply-hentai.com",
            "hentaigasm.com",
            "fakku.net",
            "gelbooru.com",
            "myhentaicomics.com",
            "extremetube.com",
            "largeporntube.com",
            "hardhotsex.com",
            "ipunishteens.com",
            "livejasmin.com",
            "pornhub.com",
            "imlive.com",
            "evilangel.com",
            "justusboys.com",
            "zzgays.com",
            "gay-lounge.net",
            "bdsmstreak.com"
        ];
    }

    async action(message : Message) : Promise < void > {
        message.delete();
        message.author.sendMessage("Your message was removed: Posting pornographic content is prohibited.");
        let infraction = new Infraction(message.author.id, moment().unix(), {
            type: 'WARN',
            increasedNotoriety: true
        }, {
            displayName: "Pornographic Link Filter",
            triggerMessage: message.content
        });
        Logging.infractionLog(await infraction.save());
    }
}

export default new PornLinkFilter();
