// @flow

//Dependencies
import {assert} from 'chai';
import sleep from 'timeout-as-promise';

//Modules
import UserUtils from '../server_src/app/UserUtils';
import {UserRecord, InfractionRecord} from '../server_src/app/DBManager';
import DiscordUtils from '../server_src/app/DiscordUtils';
import ChatFilters from '../server_src/app/ChatFilters';

//Constants
const userid = "250064170375053312" //Midnight-Test

//Buildup
const cleanDB = async() => {
    await UserRecord.remove({});
    await InfractionRecord.remove({});
    assert.equal(await InfractionRecord.count(), 0, "The Infractions collection is empty.");
    assert.equal(await UserRecord.count(), 0, "The UserRecords collection is empty.");
};
before(DiscordUtils.start);
beforeEach(cleanDB);
after(cleanDB);

//Tests
describe("UserUtils", () => {
    describe("assertUserRecord", () => {

        it("Should save a user record", async() => {
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            delete userRecord._id;
            assert.deepEqual(userRecord, {
                userid: userid,
                mutedUntil: -1,
                notoriety: 0,
                decreaseWhen: -1,
                username: 'Midnight-Test',
                username_lower: 'midnight-test'
            }, "User record inserts correctly");
        });
    });

    describe("increaseNotoriety", () => {

        it("Should increase a users notoriety level", async() => {
            await UserUtils.increaseNotoriety(userid);
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 1, "User notoriety level is 1");
        });

        it("Should increase a users notoriety level multiple times", async() => {
            for (let i = 0; i < 3; i++) {
                await UserUtils.increaseNotoriety(userid)
                await sleep(50); //Spread out requests
            }
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 3, "User notoriety level is 3");
        });

        it("Should not increase a users notoriety level above 5", async() => {
            for (let i = 0; i < 6; i++) {
                await UserUtils.increaseNotoriety(userid);
                await sleep(50); //Spread out requests
            }
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 5, "User notoriety level is still 5");
        });

    });
});