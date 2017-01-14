var webpack = require('webpack');

var serverConfig = require('./webpack.server.config.js');
var clientConfig = require('./webpack.client.config.js');

module.exports = [serverConfig, clientConfig];
