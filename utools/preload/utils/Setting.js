// ----- 配置管理 -----
const path = require('path')
const fs = require("fs")

const AppDatabase = require('./Database')
const IpUtil = require("./IpUtil");
const uploadPathKey = 'uploadPath' // 上传路径
const portKey = 'port' // 端口号
const ipKey = 'ip' // 端口号
const AuthEnable = 'authEnable' // 是否开启密码校验
const Password = 'password' // 密码

let curIp = IpUtil.getIpAddress();

// 上传路径默认值
function getDefaultUploadPath() {
    let USER_HOME = process.env.HOME || process.env.USERPROFILE
    return path.join(USER_HOME, 'Downloads');
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

function getUrl() {
    let ip = getIp()
    let port = getPort()
    return `http://${ip}:${port}`;
}

function getIp() {
    return curIp;
}

function updateIp(ip) {
    return new Promise((resolve, reject) => {
        if (!ip) {
            return reject({ success: false, message: '更新地址失败，地址为空' });
        }
        // 值没变，不更新
        if (getIp() === ip) {
            console.log("ip 值没变，不更新")
            return resolve({ success: true, message: 'ValueNotChange' });
        }
        curIp = ip;
        resolve({ success: true, message: '修改成功' });
    })
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
        console.log('--updatePassword--', value)
        AppDatabase.setStorageItem(Password, value)
        return resolve({ success: true, message: '修改成功' });
    });
}

function getPassword() {
    return AppDatabase.getStorageItem(Password, 'password')
}

function getSetting() {
    return {
        uploadPath: getUploadPath(),
        port: getPort(),
        ip: getIp(),
        url: getUrl(),
        authEnable: getAuthEnable(),
        password: getPassword()
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

    updateIp(setting[ipKey]).then((e) => {
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
}

exports.uploadPathKey = uploadPathKey
exports.portKey = portKey
exports.Password = Password
exports.AuthEnable = AuthEnable
exports.getUploadPath = getUploadPath
exports.updateUploadPath = updateUploadPath
exports.getPort = getPort
exports.updatePort = updatePort
exports.getSetting = getSetting
exports.updateSetting = updateSetting
exports.getUrl = getUrl
exports.getIp = getIp
exports.updateIp = updateIp
exports.updateAuthEnable = updateAuthEnable
exports.getAuthEnable = getAuthEnable
exports.updatePassword = updatePassword
exports.getPassword = getPassword