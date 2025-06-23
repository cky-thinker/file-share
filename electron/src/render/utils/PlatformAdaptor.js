// 跨平台适配器
const { ipcRenderer } = require('electron');

let map = {}
let dbStorage = {
    setItem: function (key, value) {
        map[key] = value
    },
    getItem: function (key) {
        return map[key]
    }
}

let onPluginEnter = function (callback) {

}
let onPluginOut = function (callback) {

}
let onPluginReady = function (callback) {

}

// 实现打开开发者工具的方法
let openDevTool = function () {
    ipcRenderer.send('open-dev-tools');
}

let getPlatform = function () {
    return 'electron'
}

// 实现关闭开发者工具的方法
let closeDevTool = function () {
    ipcRenderer.send('close-dev-tools');
}

exports.dbStorage = dbStorage
exports.onPluginEnter = onPluginEnter
exports.onPluginOut = onPluginOut
exports.onPluginReady = onPluginReady
exports.getPlatform = getPlatform
exports.openDevTool = openDevTool
exports.closeDevTool = closeDevTool
