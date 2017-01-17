var webpack = require('webpack');

var serverConfig = require('./webpack.server.config.js');
var clientConfig = require('./webpack.client.config.js');

const productionEnvPlugins = [new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify("production")
        }
    })];

const clientPlugins = clientConfig.plugins.slice(1).concat(productionEnvPlugins).concat([new webpack.optimize.CommonsChunkPlugin('common.js'), new webpack.optimize.DedupePlugin(), new webpack.optimize.UglifyJsPlugin(), new webpack.optimize.AggressiveMergingPlugin()]);

module.exports = [Object.assign({}, serverConfig, {plugins: productionEnvPlugins}), Object.assign({}, clientConfig, {plugins: clientPlugins})];
