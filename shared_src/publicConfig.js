// @flow

let config = {}

if (process.env.NODE_ENV == 'production') {
    //PRODUCTION config
    config.baseURL = "http://midnight.bemacized.net";
    config.apiHost = "";
} else {
    //DEVELOPMENT config
    config.baseURL = "http://127.0.0.1:8081";
    config.apiHost = "http://127.0.0.1:8080";
}

export default config;
