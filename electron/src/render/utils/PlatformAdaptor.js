// 跨平台适配器
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

exports.dbStorage = dbStorage
exports.onPluginEnter = onPluginEnter
exports.onPluginOut = onPluginOut
exports.onPluginReady = onPluginReady