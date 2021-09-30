const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            }
        ]
    },
    stats: {
        colors: true
    },
    mode: 'production',
    entry: './src/standalone.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'aseprite-js.bundle.js'
    },
    devtool: 'source-map'
}
