// @flow
import request from 'superagent/lib/client';

export default {

    userSearch : async(query : string) => {
        return new Promise((resolve, reject) => {
            request.post((process.env.NODE_ENV == 'production'
                ? ""
                : "http://127.0.0.1:8080") + "/api/user/search").query({q: query}).end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    },

    getInfractions : async(userid : string) => {
        return new Promise((resolve, reject) => {
            request.get((process.env.NODE_ENV == 'production'
                ? ""
                : "http://127.0.0.1:8080") + "/api/user/" + userid + "/infractions").end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    },

    getInfractionActivityStats : async() => {
        return new Promise((resolve, reject) => {
            request.get((process.env.NODE_ENV == 'production'
                ? ""
                : "http://127.0.0.1:8080") + "/api/stats/infractionactivity").end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    }
}
