const webpack = require('webpack');
const path = require('path');
const { resolve } = require('path');

module.exports = {
    mode: 'development',
    entry: "./src/index.js",
    output: {
        path: resolve("/dist"),
        filename: "bundle.js"
    },
    resolveLoader: {
        modules: [path.resolve('./loaders'), 'node_modules']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['loader1', 'loader2', 'loader3']
            }
        ]
    },
    plugins: [

    ]
}