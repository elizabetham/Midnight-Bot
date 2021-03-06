'use strict';

//Dependencies
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

//Build externals flag for excluding node_modules
var nodeModules = {};
fs.readdirSync('node_modules').filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
});

module.exports = {
    name: 'Main App',
    entry: [
        'babel-polyfill', './Midnight.js'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'Midnight.js'
    },
    plugins: [
        new webpack.BannerPlugin('require("source-map-support").install();', {
            raw: true,
            entryOnly: false
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify("development")
            }
        })
    ],
    target: 'node',
    node: {
        __dirname: false,
        __filename: false
    },
    devtool: 'sourcemap',
    module: {
        loaders: [
            {
                test: /\.(png|jpe?g)$/,
                exclude: /node_modules/,
                loader: 'file'
            }, {
                test: /\.js?$/,
                exclude: /node_modules/,
                loader: 'babel'
            }
        ]
    },
    externals: nodeModules
};
