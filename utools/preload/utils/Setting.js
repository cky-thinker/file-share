// ----- 配置管理 -----
const fs = require("fs")
const downloadsFolder = require('downloads-folder');

const AppDatabase = require('./Database');
const IpUtil = require('./IpUtil');
const Server = require("./Server");

const uploadPathKey = 'uploadPath' // 上传路径
const portKey = 'port' // 端口号
const AuthEnable = 'authEnable' // 是否开启密码校验
const Password = 'password' // 密码
const tusEnableKey = 'tusEnable' // 是否启用续传功能
const chunkSizeKey = 'chunkSize' // 上传文件的分片大小
const AutoStart = 'autoStart' // 自动启动
const ipFamilyKey = 'ipFamily' // IP协议族
const netInterfaceNameKey = 'netInterfaceName' // 网络接口名称

// 上传路径默认值
function getDefaultUploadPath() {
    return downloadsFolder();
}

function getUploadPath() {
    return AppDatabase.getStorageItem(uploadPathKey, getDefaultUploadPath);
}

/**
 * 更新上传路径
 * @param path
 * @returns {Promise<unknown>}  .then() 更新成功 .catch 更新失败
 */
function updateUploadPath(path) {
    return new Promise((resolve, reject) => {
        if (!path) {
            return reject({ success: false, message: '更新上传路径失败，路径为空' });
        }
        // 值没变，不更新
        if (getUploadPath() === path) {
            console.log("updatePath值没变，不更新")
            resolve({ success: true, message: 'ValueNotChange' })
        }
        if (!fs.existsSync(path)) {
            return reject({ success: false, message: '文件夹不存在' });
        }
        if (!fs.lstatSync(path).isDirectory()) {
            return reject({ success: false, message: '上传路径必须为文件夹' })
        }
        AppDatabase.setStorageItem(uploadPathKey, path);
        resolve({ success: true, message: '修改成功' })
    })
}

function getPort() {
    return AppDatabase.getStorageItem(portKey, 5421)
}

/**
 * 更新上传路径
 * @param port
 * @returns {Promise<unknown>}  .then() 更新成功 .catch 更新失败
 */
function updatePort(port) {
    return new Promise((resolve, reject) => {
        if (!port) {
            return reject({ success: false, message: '更新上传路径失败，端口为空' });
        }
        // 值没变，不更新
        if (getPort() === port) {
            console.log("port 值没变，不更新")
            return resolve({ success: true, message: 'ValueNotChange' });
        }
        AppDatabase.setStorageItem(portKey, port);
        resolve({ success: true, message: '修改成功' });
    });
}

let getUrl = function getUrl() {
    let ip = IpUtil.getIp()
    let port = getPort()
    return `http://${ip}:${port}`;
}

function updateAuthEnable(value) {
    return new Promise((resolve, reject) => {
        if (value == null) {
            return reject({ success: false, message: '更新失败，值为空' });
        }
        console.log('--updateAuthEnable--', value)
        AppDatabase.setStorageItem(AuthEnable, value)
        return resolve({ success: true, message: '修改成功' });
    })
}

function getAuthEnable() {
    return AppDatabase.getStorageItem(AuthEnable, false)
}

function updatePassword(value) {
    return new Promise((resolve, reject) => {
        if (value == null) {
            return reject({ success: false, message: '更新失败，值为空' });
        }
        // 值没变，不更新
        if (getPassword() === value) {
            console.log("password 值没变，不更新")
            return resolve({ success: true, message: 'ValueNotChange' })
        }
        Server.clearSession()
        console.log('--updatePassword--', value)
        AppDatabase.setStorageItem(Password, value)
        return resolve({ success: true, message: '修改成功' });
    });
}

function getPassword() {
    return AppDatabase.getStorageItem(Password, 'password')
}

function getTusEnable() {
    return AppDatabase.getStorageItem(tusEnableKey, false)
}

function updateTusEnable(value) {
    return new Promise((resolve, reject) => {
        if (value == null) {
            return reject({ success: false, message: '更新失败，值为空' });
        }
        console.log('--updateTusEnable--', value)
        AppDatabase.setStorageItem(tusEnableKey, value)
        return resolve({ success: true, message: '修改成功' });
    })
}

function getChunkSize() {
    return AppDatabase.getStorageItem(chunkSizeKey, 20)
}

/**
 * 更新分片大小
 * @param chunkSize
 * @returns {Promise<{ success:boolean, message:string }>}
 */
function updateChunkSize(chunkSize) {
    const isNumber = (value) => {
        if (typeof value == 'number') {
            return true
        }
        if (typeof value == 'string') {
            return !!value && !isNaN(value)
        }
        return false
    }
    return new Promise((resolve, reject) => {
        if (!chunkSize) {
            return reject({ success: false, message: '更新分片大小失败，值为空' })
        }
        if (!isNumber(chunkSize)) {
            return reject({ success: false, message: '更新分片大小失败，值不是数字' })
        }
        if (chunkSize <= 0) {
            return reject({ success: false, message: '更新分片大小失败，值应该大于0' })
        }
        // 值没变，不更新
        if (getChunkSize() === chunkSize) {
            console.log("chunkSize 值没变，不更新")
            return resolve({ success: true, message: 'ValueNotChange' })
        }
        AppDatabase.setStorageItem(chunkSizeKey, chunkSize)
        return resolve({ success: true, message: '修改成功' })
    });
}

/**
 * 更新自动启动
 * @param value
 * @returns {Promise<unknown>}
 */
function updateAutoStart(value) {
    return new Promise((resolve, reject) => {
        if (value == null) {
            return reject({ success: false, message: '更新失败，值为空' });
        }
        console.log('--updateAutoStart--', value)
        AppDatabase.setStorageItem(AutoStart, value)
        return resolve({ success: true, message: '修改成功' });
    });
}

function getAutoStart() {
    return AppDatabase.getStorageItem(AutoStart, false)
}


function getSetting() {
    return {
        uploadPath: getUploadPath(),
        port: getPort(),
        ip: IpUtil.getIp(),
        url: getUrl(),
        authEnable: getAuthEnable(),
        password: getPassword(),
        tusEnable: getTusEnable(),
        chunkSize: getChunkSize(),
        autoStart: getAutoStart(),
    }
}

function updateSetting(setting) {
    console.log('---updateSetting---', setting)
    updateUploadPath(setting[uploadPathKey]).then((e) => {
        console.log(e)
    }).catch((e) => {
        console.log(e)
    })
    updatePort(setting[portKey]).then((e) => {
        console.log(e)
    }).catch((e) => {
        console.log(e)
    })
    updateAuthEnable(setting[AuthEnable]).then((e) => {
        console.log(e)
    })
    updatePassword(setting[Password]).then((e) => {
        console.log(e)
    })

    updateTusEnable(setting[tusEnableKey]).then((e) => {
        console.log(e)
    }).catch((e) => {
        console.log(e)
    })
    updateChunkSize(setting[chunkSizeKey]).then((e) => {
        console.log(e)
    }).catch((e) => {
        console.log(e)
    })
}

function getIpFamily() {
    return AppDatabase.getStorageItem(ipFamilyKey, 'ipv4')
}

function setIpFamily(value) {
    if (!value) {
        throw new Error('IP协议族不能为空');
    }
    if (value !== 'ipv4' && value !== 'ipv6') {
        throw new Error('IP协议族必须是ipv4或ipv6');
    }
    AppDatabase.setStorageItem(ipFamilyKey, value);
}

function getNetInterfaceName() {
    return AppDatabase.getStorageItem(netInterfaceNameKey, '')
}

function setNetInterfaceName(value) {
    if (!value) {
        throw new Error('网络接口名称不能为空');
    }
    AppDatabase.setStorageItem(netInterfaceNameKey, value);
}

exports.uploadPathKey = uploadPathKey
exports.portKey = portKey
exports.Password = Password
exports.AuthEnable = AuthEnable
exports.tusEnableKey = tusEnableKey
exports.chunkSizeKey = chunkSizeKey
exports.AutoStart = AutoStart
exports.ipFamilyKey = ipFamilyKey
exports.netInterfaceNameKey = netInterfaceNameKey
exports.getUploadPath = getUploadPath
exports.updateUploadPath = updateUploadPath
exports.getPort = getPort
exports.getUrl = getUrl
exports.updatePort = updatePort
exports.getSetting = getSetting
exports.updateSetting = updateSetting
exports.updateAuthEnable = updateAuthEnable
exports.getAuthEnable = getAuthEnable
exports.updatePassword = updatePassword
exports.getPassword = getPassword
exports.getTusEnable = getTusEnable
exports.updateTusEnable = updateTusEnable
exports.getChunkSize = getChunkSize
exports.updateChunkSize = updateChunkSize
exports.updateAutoStart = updateAutoStart
exports.getAutoStart = getAutoStart
exports.getIpFamily = getIpFamily
exports.setIpFamily = setIpFamily
exports.getNetInterfaceName = getNetInterfaceName
exports.setNetInterfaceName = setNetInterfaceName