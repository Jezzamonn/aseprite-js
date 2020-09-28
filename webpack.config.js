const path = require('path');
const webpack = require('webpack');

module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            }
        ]
    },
    stats: {
        colors: true
    },
    mode: 'development',
    entry: './src/aseprite-loader.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'aseprite-loader.bundle.js'
    },
    devtool: 'source-map'
}