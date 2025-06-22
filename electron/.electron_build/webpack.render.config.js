'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const {dependencies, version} = require('../package.json')

console.log('process.env.NODE_ENV', process.env.NODE_ENV)

const isProduction = process.env.NODE_ENV === 'production'

const renderConfig = {
    mode: process.env.NODE_ENV,
    devtool: 'eval-cheap-module-source-map',
    optimization: {
        emitOnErrors: false
    },
    entry: {
        main: path.join(__dirname, '../src/render/render.js')
    },
    externals: [
        ...Object.keys(dependencies || {})
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.node$/,
                loader: 'node-loader',
                options: {
                    name: '[name].[ext]'
                }
            }
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    },
    cache: false,
    output: {
        filename: 'render.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist')
    },
    plugins: [
        new webpack.DefinePlugin({
            'global.APP_VERSION_STRING': `${JSON.stringify(version)}`
        })
    ],
    resolve: {
        extensions: ['.js', '.json', '.node']
    },
    target: 'electron-main'
}

// Fix debugger breakpoints
if (!isProduction) {
    renderConfig.devtool = 'inline-source-map'
} else {
    renderConfig.devtool = 'nosources-source-map'
    renderConfig.mode = 'production'
    renderConfig.optimization.minimize = true
}

module.exports = renderConfig
