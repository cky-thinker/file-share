'use strict'

const {say} = require('cfonts')
const path = require('path')
const chalk = require('chalk')
const del = require('del')
const fs = require('fs-extra')
const webpack = require('webpack')
const Listr = require('listr')


const mainConfig = require('./webpack.main.config')
const renderConfig = require('./webpack.render.config')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '
const isCI = process.env.CI || false

console.log('process.env.NODE_ENV', process.env.NODE_ENV)

if (process.env.BUILD_TARGET === 'clean') {
    clean();
} else if (process.env.BUILD_TARGET === 'web') {
    // TODO
} else {
    build()
}

function clean() {
    console.log(`\n clean... \n`)
    del.sync(['dist/main.js'])
    del.sync(['dist/static'])
    console.log(`\n${doneLog}\n`)
}

async function build() {
    clean()

    greeting()

    let results = ''

    const tasks = new Listr(
        [
            {
                title: 'building main process',
                task: async () => {
                    await pack(mainConfig)
                        .then(result => {
                            results += result + '\n\n'
                        })
                        .catch(err => {
                            console.log(`\n  ${errorLog}failed to build main process`)
                            console.error(`\n${err}\n`)
                            process.exit(1)
                        })
                }
            },
            {
                title: 'building render process',
                task: async () => {
                    await pack(renderConfig)
                        .then(result => {
                            results += result + '\n\n'
                        })
                        .catch(err => {
                            console.log(`\n  ${errorLog}failed to build render process`)
                            console.error(`\n${err}\n`)
                            process.exit(1)
                        })
                }
            }
        ],
        {concurrent: 1}
    )

    await tasks
        .run()
        .then(() => {
            process.stdout.write('\x1B[2J\x1B[0f')
            console.log(`\n\n${results}`)
            console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
            process.exit()
        })
        .catch(err => {
            process.exit(1)
        })
}

function pack(config) {
    return new Promise((resolve, reject) => {
        webpack(config, (err, stats) => {
            if (err) reject(err.stack || err)
            else if (stats.hasErrors()) {
                let err = ''

                stats.toString({
                    chunks: false,
                    colors: true
                })
                    .split(/\r?\n/)
                    .forEach(line => {
                        err += `    ${line}\n`
                    })

                reject(err)
            } else {
                resolve(stats.toString({
                    chunks: false,
                    colors: true
                }))
            }
        })
    })
}

function greeting() {
    const cols = process.stdout.columns
    let text = ''

    if (cols > 155) text = 'building fileshare'
    else if (cols > 76) text = 'building|fileshare'
    else text = false

    if (text && !isCI) {
        say(text, {
            colors: ['yellow'],
            font: 'simple3d',
            space: false
        })
    } else {
        console.log(chalk.yellow.bold('\n  building fileshare'))
    }
}
