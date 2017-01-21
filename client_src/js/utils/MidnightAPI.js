// @flow

import request from 'superagent/lib/client';

import Config from '../../../shared_src/publicConfig';

export default {

    userSearch : async(query : string) => {
        return new Promise((resolve, reject) => {
            request.post(Config.apiHost + "/api/user/search").query({q: query}).end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    },

    getInfractions : async(userid : string) => {
        return new Promise((resolve, reject) => {
            request.get(Config.apiHost + "/api/user/" + userid + "/infractions").end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    },

    getInfractionActivityStats : async() => {
        return new Promise((resolve, reject) => {
            request.get(Config.apiHost + "/api/stats/infractionactivity").end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    }
}
