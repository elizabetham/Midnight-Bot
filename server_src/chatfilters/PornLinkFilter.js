// @flow

import {Filter} from '../ChatFilters';

import moment from 'moment';
import {Message} from 'discord.js';
import UserUtils from '../UserUtils';
import Logging from '../Logging';
import Infraction from '../Infraction';

class PornLinkFilter extends Filter {

    constructor() {
        super("Porn Link Filter");
    }

    async check(message : Message) : Promise < boolean > {
        let rules = [
            /.*\/r\/rule34.*/gi, // /r/rule34
            /.*https{0,1}:\/\/rule34\.paheal\.net.*/gi, // rule34.paheal.net
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)youporn\.com.*/gi, // YouPorn
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)xnxx\.com.*/gi, // xnxx
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)porn\.com.*/gi, // porn.com
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)ixxx\.com.*/gi, // ixxx
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)xvideos\.com.*/gi, // xVideos
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)cliti\.com.*/gi, // Cliti
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)fuq\.com.*/gi, // Fuq
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)alohatube\.com.*/gi, // AlohaTube
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)dinotube\.com.*/gi, // DinoTube
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)rule34\.xxx.*/gi, // Rule34
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)xhamster\.com.*/gi, // xHamster
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)youjizz\.com.*/gi, // YouJizz
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)hclips\.com.*/gi, // hclips
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)tnaflix\.com.*/gi, // tnaflix
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)tube8\.com.*/gi, // Tube8
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)spankbang\.com.*/gi, // Spankbang
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)theporndude\.com.*/gi, // ThePornDude
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)drtuber\.com.*/gi, // DrTuber
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)spankwire\.com.*/gi, // SpankWire
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)keezmovies\.com.*/gi, // KeezMovies
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)nuvid\.com.*/gi, // nuvid
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)sunporno\.com.*/gi, // SunPorno
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)mofosex\.com.*/gi, // mofosex
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)xxcartoon\.com.*/gi, // xxcartoon
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)simply-hentai\.com.*/gi, // Simply Hentai
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)hentaigasm\.com.*/gi, // HentaiGasm
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)fakku\.net.*/gi, // Fakku
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)gelbooru\.com.*/gi, // Gelbooru
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)myhentaicomics\.com.*/gi, // MyHentaiComics
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)extremetube\.com.*/gi, // ExtremeTube
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)largeporntube\.com.*/gi, // LargePornTube
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)hardhotsex\.com.*/gi, // hardhotsex
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)ipunishteens\.com.*/gi, // ipunishteens
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)livejasmin\.com.*/gi, // LiveJasmin
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)pornhub\.com.*/gi, // PornHub
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)imlive\.com.*/gi, // IMlive
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)evilangel\.com.*/gi, // EvilAngel
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)justusboys\.com.*/gi, // JustUsBoys
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)zzgays\.com.*/gi, // zzGays
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)gay-lounge\.net.*/gi, // Gay Lounge
            /.*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)bdsmstreak\.com.*/gi // bdsmstreak
        ];
        return rules.filter(regex => message.content.match(regex)).length > 0;
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
        UserUtils.assertUserRecord(message.author.id);
        Logging.infractionLog(await infraction.save());
    }
}

export default new PornLinkFilter();
