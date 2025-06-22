'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const {dependencies, version} = require('../package.json')

const isProduction = process.env.NODE_ENV === 'production'

const mainConfig = {
    mode: process.env.NODE_ENV,
    devtool: 'eval-cheap-module-source-map',
    optimization: {
        emitOnErrors: false
    },
    entry: {
        main: path.join(__dirname, '../src/main/main.js')
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
        filename: 'main.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist')
    },
    plugins: [
        new webpack.DefinePlugin({
            'global.APP_VERSION_STRING': `${JSON.stringify(version)}`
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '../static'),
                    to: path.join(__dirname, '../dist/static')
                }
            ]
        })
    ],
    resolve: {
        extensions: ['.js', '.json', '.node']
    },
    target: 'electron-main'
}

// Fix debugger breakpoints
if (!isProduction) {
    mainConfig.devtool = 'inline-source-map'
} else {
    mainConfig.devtool = 'nosources-source-map'
    mainConfig.mode = 'production'
    mainConfig.optimization.minimize = true
}

/**
 * Adjust mainConfig for production settings
 */
if (isProduction) {
    mainConfig.devtool = 'nosources-source-map'
    mainConfig.mode = 'production'
    mainConfig.optimization.minimize = true
}

module.exports = mainConfig
