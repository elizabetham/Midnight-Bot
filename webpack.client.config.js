'use strict';

//Dependencies
var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    name: 'Web UI',
    entry: [
        'babel-polyfill', './client_src/js/main.js'
    ],
    output: {
        path: path.join(__dirname, 'dist/app/res/htdocs'),
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': '"DEVELOPMENT"'
            }
        }),
        new HtmlWebpackPlugin({template: './client_src/index.html'})
    ],
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: "react-hot",
                exclude: /node_modules/
            }, {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                query: {
                    presets: ['react']
                }
            }, {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            }, {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=8192'
            }
        ]
    },
    target: 'web'
}
