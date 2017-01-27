// @flow

import {assert} from 'chai';

//Dependencies
import {Redis} from '../server_src/utils/DBManager';

//All filters
import {processMessage} from '../server_src/chatfilters/ChatFilters';

//Individual filters
import BazzaFilter from '../server_src/chatfilters/all/BazzaFilter';
import BulkMentionFilter from '../server_src/chatfilters/all/BulkMentionFilter';
import DiscordInviteFilter from '../server_src/chatfilters/all/DiscordInviteFilter';
import DuplicateMessageFilter from '../server_src/chatfilters/all/DuplicateMessageFilter';
import EmojiSpamFilter from '../server_src/chatfilters/all/EmojiSpamFilter';
import LobbyLinkFilter from '../server_src/chatfilters/all/LobbyLinkFilter';
import MentionFilter from '../server_src/chatfilters/all/MentionFilter';
import OffensiveBehaviourFilter from '../server_src/chatfilters/all/OffensiveBehaviourFilter';
import PornLinkFilter from '../server_src/chatfilters/all/PornLinkFilter';
import RacismFilter from '../server_src/chatfilters/all/RacismFilter';
import RepeatedCharacterFilter from '../server_src/chatfilters/all/RepeatedCharacterFilter';
import ScamLinkFilter from '../server_src/chatfilters/all/ScamLinkFilter';
import FloodSpamFilter from '../server_src/chatfilters/all/FloodSpamFilter';

describe("Chat Filters", () => {

    describe(FloodSpamFilter.displayName, () => {
        beforeEach(() => {
            Redis.del("TEST_USER:floodcount");
        });

        it("Should not trigger for 5 spammed messages", async() => {
            for (let i = 0; i < 5; i++) {
                assert.isNotOk(await FloodSpamFilter.check(getMessageMock("Hi!", "TEST_USER")));
            }
        });

        it("Should trigger for 6 spammed messages", async() => {
            for (let i = 0; i < 5; i++) {
                assert.isNotOk(await FloodSpamFilter.check(getMessageMock("Hi!", "TEST_USER")));
            }
            assert.isOk(await FloodSpamFilter.check(getMessageMock("Hi!", "TEST_USER")));
        });

        it("Should trigger for 10 spammed messages", async() => {
            for (let i = 0; i < 5; i++) {
                assert.isNotOk(await FloodSpamFilter.check(getMessageMock("Hi!", "TEST_USER")));
            }
            for (let i = 0; i < 10; i++) {
                assert.isOk(await FloodSpamFilter.check(getMessageMock("Hi!", "TEST_USER")));
            }
        });
    });

    describe(ScamLinkFilter.displayName, () => {

        const inside = ["http://www.giftsofsteam.com/L3A8xjm5", "http://lolfreerpcodes.com/?ref=cDGFSgsne", "http://riotpoints.give-aways.net/?id=CsMOKN75", "http://www.steamdigitalgift.com/B9gJxb5"];
        const outside = ["http://store.steampowered.com/app/359050/"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await ScamLinkFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await ScamLinkFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(RepeatedCharacterFilter.displayName, () => {

        const inside = ["hiiiiiii there", "omggggggggg"];
        const outside = ["hi", "hiiiiii", "......", "whitespace: <       >"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await RepeatedCharacterFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await RepeatedCharacterFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(RacismFilter.displayName, () => {

        const inside = [
            "Nigger",
            "N1gg3r",
            "Negro",
            "n1664",
            "Jew",
            "Jews",
            "J3w",
            "J3ws",
            "Fag",
            "Faggot",
            "Fagget",
            "F46"
        ];
        const outside = [
            "Midnight",
            "Nigher",
            "Fagin",
            "Leafage",
            "Bejeweled",
            "Jeweler"
        ];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await RacismFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await RacismFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(PornLinkFilter.displayName, () => {

        const inside = ["http://pornhub.com", "http://www.pornhub.com/view_video.php?viewkey=ph57b998b1f2183", "https://www.reddit.com/r/rule34/"];
        const outside = ["http://hasbro.com", "https://www.reddit.com/r/oldladiesbakingpies"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await PornLinkFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await PornLinkFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(OffensiveBehaviourFilter.displayName, () => {

        const inside = ["kys", "kkkyyyysssss"];
        const outside = ["ky", "ys", "skyscraper"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await OffensiveBehaviourFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await OffensiveBehaviourFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(MentionFilter.displayName, () => {

        const prohibited = ["201537591823171585", "142548906570547200"];
        const allowed = ["RANDOM_USER"];

        prohibited.forEach(uid => {
            it("Should trigger for UID:'" + uid + "'", async() => {
                assert.isOk(await MentionFilter.check(getMessageMock("", "", uid)));
            });
        });

        allowed.forEach(uid => {
            it("Should not trigger for UID:'" + uid + "'", async() => {
                assert.isNotOk(await MentionFilter.check(getMessageMock("", "", uid)));
            });
        });

    });

    describe(LobbyLinkFilter.displayName, () => {

        const inside = ["😀http://bemacized.net/", "http://google.com/"];
        const outside = ["Not a URL"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "' in '249323706285948928'", async() => {
                assert.isOk(await LobbyLinkFilter.check(getMessageMock(message, null, null, "249323706285948928")));
            });
            it("Should not trigger for '" + message + "' in 'RegularChannel'", async() => {
                assert.isNotOk(await LobbyLinkFilter.check(getMessageMock(message, null, null, "RegularChannel")));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "' in '249323706285948928'", async() => {
                assert.isNotOk(await LobbyLinkFilter.check(getMessageMock(message, null, null, "249323706285948928")));
            });
            it("Should not trigger for '" + message + "' in 'RegularChannel'", async() => {
                assert.isNotOk(await LobbyLinkFilter.check(getMessageMock(message, null, null, "RegularChannel")));
            });
        });

    });

    describe(EmojiSpamFilter.displayName, () => {

        const inside = ["😀☺️☺️☺️☺️☺️☺️☺️☺️☺️", "☺️☺️☺️☺️☺️☺️☺️☺️☺️☺️☺️☺️"];
        const outside = ["☺️☺️☺️", "☺️☺️☺️☺️☺️☺️☺️☺️"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await EmojiSpamFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await EmojiSpamFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(DuplicateMessageFilter.displayName, () => {

        before(async() => {
            //Make sure user has no previous message
            Redis.del("TEST_USER:lastMessage");
        });

        it("Should not trigger on the first message", async() => {
            assert.isNotOk(await DuplicateMessageFilter.check(getMessageMock("Test message", "TEST_USER")));
        });

        it("Should trigger on the second and third message", async() => {
            for (let i = 0; i < 2; i++) {
                assert.isOk(await DuplicateMessageFilter.check(getMessageMock("Test message", "TEST_USER")));
            }
        });

    });

    describe(DiscordInviteFilter.displayName, () => {

        const inside = ["https://discord.gg/ZB66H", "http://discord.gg/"];
        const outside = ["https://discordapp.com/"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await DiscordInviteFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await DiscordInviteFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(BazzaFilter.displayName, () => {

        const inside = ["bazaaaa", "bbbaazzzaaaaa", "BaZaAaA"];
        const outside = ["bazaaa", "bazza", "azzaaaa"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await BazzaFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await BazzaFilter.check(getMessageMock(message)));
            });
        });

    });

    describe(BulkMentionFilter.displayName, () => {

        const inside = ["@one @two @three @four @five", "@one @two @three @four @five @six @seven @eight"];
        const outside = ["@one @two @three @four", "@one"];

        inside.forEach(message => {
            it("Should trigger for '" + message + "'", async() => {
                assert.isOk(await BulkMentionFilter.check(getMessageMock(message)));
            });
        });

        outside.forEach(message => {
            it("Should not trigger for '" + message + "'", async() => {
                assert.isNotOk(await BulkMentionFilter.check(getMessageMock(message)));
            });
        });

    });

    describe("ChatFilters#processMessage()", () => {
        beforeEach(() => {
            Redis.del("TEST_USER:floodcount");
            Redis.del("TEST_USER:lastMessage");
        });

        it("Should not trigger for 'Hello!'", async() => {
            let result = await processMessage(getMessageMock("Hello!", "TEST_USER", "RANDOM_USER", "TEST_CHANNEL"), false);
            assert.isNotOk(result);
        });

        //Priority checks

        it("Should trigger the '" + BazzaFilter.displayName + "' and not the '" + RepeatedCharacterFilter.displayName + "'", async() => {
            let result = await processMessage(getMessageMock("bazzaaaaa", "TEST_USER", "RANDOM_USER", "TEST_CHANNEL"), false);
            assert.isOk(result === BazzaFilter);
        });

        it("Should trigger the '" + PornLinkFilter.displayName + "' and not the '" + LobbyLinkFilter.displayName + "'", async() => {
            let result = await processMessage(getMessageMock("http://pornhub.com/ http://giftsofsteam.com/", "TEST_USER", "RANDOM_USER", "TEST_CHANNEL"), false);
            assert.isOk(result === PornLinkFilter);
        });

        //More priority checks will be added once discrepancies are discovered.

    });
});

const getMessageMock = (content : string, authorId?:
    ? string, mention?:
    ? string, channelId?: string) => {
    return {
        content: content,
        mentions: mention
            ? {
                users : {
                    array: () => {
                        return [
                            {
                                id: mention
                            }
                        ]
                    }
                }
            }
            : null,
        author: authorId
            ? {
                id : authorId
            }
            : null,
        channel: channelId
            ? {
                id : channelId
            }
            : null
    }
}
