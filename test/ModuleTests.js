// @flow

//Dependencies
import {assert} from 'chai';
import sleep from 'timeout-as-promise';

//Modules
import UserUtils from '../server_src/UserUtils';
import {UserRecord, InfractionRecord} from '../server_src/DBManager';
import DiscordUtils from '../server_src/DiscordUtils';
import ChatFilters from '../server_src/ChatFilters';

//Constants
const userid = "250064170375053312" //Midnight-Test

//Buildup
const cleanDB = async() => {
    await UserRecord.remove({});
    await InfractionRecord.remove({});
    assert.equal(await InfractionRecord.count(), 0, "The Infractions collection is not empty.");
    assert.equal(await UserRecord.count(), 0, "The UserRecords collection is not empty.");
}

//Tests
describe("UserUtils", () => {

    before(DiscordUtils.start);

    after(async() => {
        cleanDB();
        DiscordUtils.stop();
    });
    beforeEach(cleanDB);

    describe("assertUserRecord", () => {
        it("Should save a user record", async() => {
            //Assure there is no record yet
            let noRecord = await UserRecord.findOne({userid: userid});
            assert.isNotOk(noRecord, "Database contains data when it should not");

            //Assure that assertUserRecord generates a correct record
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            delete userRecord._id;
            delete userRecord.__v;
            assert.deepEqual(userRecord, {
                userid: userid,
                mutedUntil: -1,
                notoriety: 0,
                decreaseWhen: -1,
                username: 'Midnight-Test',
                username_lower: 'midnight-test'
            }, "User doesn't generate correctly");

            //Assure that the record is correctly saved to the db
            let dbRecord : UserRecord = await UserRecord.findOne({userid: userid});
            assert.isOk(dbRecord, "A record has been saved");
            dbRecord = dbRecord.toObject();
            delete dbRecord._id;
            delete dbRecord.__v;
            assert.deepEqual(dbRecord, {
                userid: userid,
                mutedUntil: -1,
                notoriety: 0,
                decreaseWhen: -1,
                username: 'Midnight-Test',
                username_lower: 'midnight-test'
            }, "User does not appear in DB");

        });
    });

    describe("increaseNotoriety", () => {

        it("Should increase a users notoriety level", async() => {
            await UserUtils.increaseNotoriety(userid);
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 1, "User notoriety level is not 1");
        });

        it("Should increase a users notoriety level multiple times", async() => {
            for (let i = 0; i < 3; i++) {
                await UserUtils.increaseNotoriety(userid)
                await sleep(50); //Spread out requests
            }
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 3, "User notoriety level is not 3");
        });

        it("Should not increase a users notoriety level above 5", async() => {
            for (let i = 0; i < 6; i++) {
                await UserUtils.increaseNotoriety(userid);
                await sleep(50); //Spread out requests
            }
            let userRecord = (await UserUtils.assertUserRecord(userid)).toObject();
            assert.equal(userRecord.notoriety, 5, "User notoriety level is not 5");
        });

    });
});
