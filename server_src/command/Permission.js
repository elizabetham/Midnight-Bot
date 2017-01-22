// @flow

export default class Permission {

    guildId : string;
    roleId : string;
    everyone : boolean;

    constructor(guildId : string, roleId : ?string) {
        this.guildId = guildId;
        this.roleId = roleId ? roleId : "";
        this.everyone = !roleId;
    }

}

export const PERMISSION_PRESETS = {
    CONVICTS: {
        EVERYONE: new Permission("219303568396517386", null),
        DAYLIGHT: new Permission("219303568396517386", "267683175524728833"),
        PREVIOUS_SHOWDOWN_PLAYER: new Permission("219303568396517386", "254915674969866241"),
        MUTED: new Permission("219303568396517386", "249750946299510785"),
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
        EVERYONE: new Permission("239402656576045056",null),
        BOTDEV: new Permission("239402656576045056","250425466643677184"),
        MIDNIGHT: new Permission("239402656576045056","250088244069269504"),
        DISCORD_ADMIN: new Permission("239402656576045056","242850318512029697"),
        BANNER: new Permission("239402656576045056","258645540772904960"),
        SPARK: new Permission("239402656576045056","239449217225981952"),
        SPARK_TEST: new Permission("239402656576045056","239446550202286080"),
        MUTED: new Permission("239402656576045056","250030009840828426"),
        MIDNIGHT_TEST: new Permission("239402656576045056","250064844277940224")
    }
}
