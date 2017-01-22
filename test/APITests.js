// @flow

//Dependencies
import chai from 'chai';
import chaiSubset from 'chai-subset';
import sleep from 'timeout-as-promise';
import request from 'supertest';
import _ from 'lodash';
import moment from 'moment';

//configure chai
chai.use(chaiSubset);
const assert = (chai.assert : Object); //TODO: Research creation of flow-typed libdef for chai-subset

//Modules
import {UserRecord, InfractionRecord} from '../server_src/utils/DBManager';
import app from '../server_src/http/HTTPServer';

//Buildup
const cleanDB = async() => {
    await UserRecord.remove({});
    await InfractionRecord.remove({});
    assert.equal(await InfractionRecord.count(), 0, "The Infractions collection is not empty.");
    assert.equal(await UserRecord.count(), 0, "The UserRecords collection is not empty.");
};

describe('API Tests', function() {

    before(async() => {

        await cleanDB();

        let currentTime = moment().unix();

        await Promise.all(_.times(5, async(i) => {
            await new UserRecord({
                userid: i,
                mutedUntil: -1,
                notoriety: 0,
                decreaseWhen: -1,
                username: "user_" + i,
                username_lower: "user_" + i
            }).save()
        }));
        await Promise.all(_.times(20, async(i) => {
            await new InfractionRecord({
                userid: Math.floor(i / 4),
                timestamp: currentTime - i * 900,
                filter: {
                    displayName: "Emoji Filter",
                    triggerMessage: "offending message"
                },
                action: {
                    increasedNotoriety: false,
                    type: i < 10
                        ? "WARN"
                        : "MUTE",
                    meta: i < 10
                        ? undefined
                        : 300
                }
            }).save();
        }));
    });

    after(cleanDB);

    describe('/api/user', function() {

        describe('GET /api/user/0', function() {
            it('Should respond with the correct data', function(done) {
                request(app).get('/api/user/0').set('Accept', 'application/json').expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.deepEqual(res.body, {
                        "userid": "0",
                        "username": "user_0",
                        "username_lower": "user_0",
                        "notoriety": 0
                    }, "Unexpected response output");

                    done();
                });
            });

            it('Should respond with a 404', function(done) {
                request(app).get('/api/user/5').set('Accept', 'application/json').expect(404).end(function(err, res) {
                    err
                        ? done(err)
                        : done();
                });
            });

        });

        describe('GET /api/user/0/infractions', function() {

            it('Should respond with the correct data', function(done) {

                request(app).get('/api/user/0/infractions').set('Accept', 'application/json').expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.typeOf(res.body, 'array', "Response is not an array");

                    assert.lengthOf(res.body, 4, "Response array contains more or fewer elements than expected");

                    res.body.forEach(result => assert.containSubset(result, {
                        "userid": "0",
                        "action": {
                            "increasedNotoriety": false,
                            "type": "WARN"
                        },
                        "filter": {
                            "displayName": "Emoji Filter",
                            "triggerMessage": "offending message"
                        },
                        "username": "user_0"
                    }, "Results don't contain example subset"));

                    done();
                });
            });

            it('Should respond with a 404 for a non existant user', function(done) {
                request(app).get('/api/user/5/infractions').set('Accept', 'application/json').expect(404).end(function(err, res) {
                    err
                        ? done(err)
                        : done();
                });
            });

        });

        describe('POST /api/user/search', function() {

            it('Should respond with the correct data for query \'user_\'', function(done) {
                request(app).post('/api/user/search').set('Accept', 'application/json').query({q: 'user_'}).expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.typeOf(res.body, 'array', "Response is not an array");

                    assert.lengthOf(res.body, 5, "Response array contains more or fewer elements than expected");

                    res.body.forEach((result, index) => assert.deepEqual(result, {
                        "username": "user_" + index,
                        "userid": String(index)
                    }, "Unexpected response output"));

                    done();
                });
            });

            it('Should respond with the correct data for query \'user_0\'', function(done) {
                request(app).post('/api/user/search').set('Accept', 'application/json').query({q: 'user_0'}).expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.typeOf(res.body, 'array', "Response is not an array");

                    assert.lengthOf(res.body, 1, "Response array contains more or fewer elements than expected");

                    assert.deepEqual(res.body, [
                        {
                            "username": "user_0",
                            "userid": "0"
                        }
                    ], "Unexpected response output");
                    done();
                });
            });

            it('Should respond with empty data for query \'user_5\'', function(done) {
                request(app).post('/api/user/search').set('Accept', 'application/json').query({q: 'user_5'}).expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.typeOf(res.body, 'array', "Response is not an array");

                    assert.lengthOf(res.body, 0, "Response array has more than 0 elements");
                    done();
                });
            });

            it('Should error out when no query is provided', function(done) {
                request(app).post('/api/user/search').set('Accept', 'application/json').expect(400).end(function(err, res) {
                    if (err)
                        return done(err);
                    assert.deepEqual(res.body, {
                        "error": "missing 'q' query parameter"
                    }, "Unexpected response output");
                    done();
                });
            });

        });

    });

    describe('/api/stats', function() {

        describe('GET /api/stats/infractionactivity', function() {

            it('Should respond with the correct data', function(done) {
                request(app).get('/api/stats/infractionactivity').set('Accept', 'application/json').expect(200).end(function(err, res) {
                    if (err)
                        return done(err);

                    assert.property(res.body, 'hours', "Response does not contain 'hours' property.");
                    assert.property(res.body, 'days', "Response does not contain 'days' property.");
                    assert.typeOf(res.body.hours, 'array', "'hours' property is not an array.");
                    assert.typeOf(res.body.days, 'array', "'days' property is not an array.");

                    //TODO: Code way to reliably check actual data against example data

                    done();
                });
            });

        });
    });
});
