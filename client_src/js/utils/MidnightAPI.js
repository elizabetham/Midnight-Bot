// @flow
import request from 'superagent/lib/client';

export default {

    userSearch : async(query : string) => {
        return new Promise((resolve, reject) => {
            request.post("/api/user/search").query({q: query}).end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    },

    getInfractions : async(userid : string) => {
        return new Promise((resolve, reject) => {
            request.get("/api/user/" + userid + "/infractions").end((err, response) => {
                if (err)
                    reject(err);
                resolve(JSON.parse(response.text));
            })
        });
    }
}
