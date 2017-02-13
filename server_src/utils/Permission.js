// @flow

import DiscordUtils from './DiscordUtils';

export default class Permission {

    guildId : string;
    roleId : string;
    everyone : boolean;

    constructor(guildId : string, roleId :
        ? string) {
        this.guildId = guildId;
        this.roleId = roleId
            ? roleId
            : "";
        this.everyone = !roleId;
        this.getRole = this.getRole.bind(this);
    }

    getRole : Function;

    getRole() {
        return DiscordUtils.getRoleById(this.roleId);
    }

}

export const PERMISSION_PRESETS = {
    MAGICANDCHILL: {
        EVERYONE: new Permission("162586705524686848", "162586705524686848"),
        MODS: new Permission("162586705524686848", "162588038554189824"),
        JUDGE: new Permission("162586705524686848", "205776083159613440"),
        BOTDEV: new Permission("162586705524686848", "239426696883863592"),
        BOTS: new Permission("162586705524686848", "239438814806802435"),
        MIDNIGHTMNC: new Permission("162586705524686848", "280463598093074433")
    },
    CONVICTS: {
        EVERYONE: new Permission("219303568396517386", "219303568396517386"),
        DAYLIGHT: new Permission("219303568396517386", "267683175524728833"),
        PREVIOUS_SHOWDOWN_PLAYER: new Permission("219303568396517386", "254915674969866241"),
        MUTED: new Permission("219303568396517386", "249750946299510785"),
        SILVER_SOULS: new Permission("219303568396517386", "272678868605992960"),
        TWITCH_SUBSCRIBER: new Permission("219303568396517386", "250050237966581761"),
        MIDNIGHT: new Permission("219303568396517386", "250089479040270346"),
        PLATINUM_PEEPS: new Permission("219303568396517386", "249347823559114752"),
        BOTDEV: new Permission("219303568396517386", "250425537485471756"),
        DIAMOND_DETAIL: new Permission("219303568396517386", "250225638462586880"),
        BOT: new Permission("219303568396517386", "250089105214406656"),
        MODERATOR: new Permission("219303568396517386", "252595763484295178"),
        MASTER_MODS: new Permission("219303568396517386", "247681246027710464"),
        GRANDMASTER_GANG: new Permission("219303568396517386", "248019311090728961")
    },
    BOTDEV: {
        EVERYONE: new Permission("239402656576045056", "239402656576045056"),
        SILVER_SOULS: new Permission("239402656576045056", "250030009840828426"),
        MODERATOR: new Permission("239402656576045056", "242850318512029697")
    }
}
