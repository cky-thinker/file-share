let _setImmediate = setTimeout;
// Fix
process.once('loaded', function () {
    global.setImmediate = _setImmediate;
});
require('../common/globalSetting')
const IpUtil = require('./utils/IpUtil')
const Setting = require('./utils/Setting')
const Server = require('./utils/Server')
const FileUtil = require('./utils/FileUtil')
const FileDb = require('./utils/FileDb')
const PlatformAdaptor = require('./utils/PlatformAdaptor')
const EventDispatcher = require('./utils/EventDispatcher')

// 进入插件
PlatformAdaptor.onPluginEnter(({code, type, payload}) => {
    let checkStart = false;
    if (type === 'files' && !!payload) {
        console.log("快捷方式进入应用", payload)
        payload.forEach((toAddFile) => {
            if (toAddFile.isFile) {
                FileDb.addFile(toAddFile)
            }
        })
        checkStart = true;
    } else if (type === 'over') {
        console.log('文本分享方式进入应用', payload)
        if (payload) {
            FileDb.addText(payload)
        }
        checkStart = true;
    }
    if (checkStart && Server.getServerStatus() === Server.StatusStop) {
        Server.startServer()
    }
})

// 退出插件
PlatformAdaptor.onPluginOut(() => {
    console.log('用户退出应用')
})

// 插件装配
PlatformAdaptor.onPluginReady(() => {
    console.log('插件装配完成，已准备好')
    Setting.getSetting(); // 初始化配置
})

// 配置更新
const updateSetting = (setting) => {
    return new Promise((resolve, reject) => {
        let updateUploadPath = Setting.updateUploadPath(setting[Setting.uploadPathKey]);
        let updatePort = Setting.updatePort(setting[Setting.portKey]).then((result) => {
            if (result.message === 'ValueNotChange') {
                console.log("端口未变更")
                return;
            }
            // 端口更新成功后重启服务
            Server.stopServer();
            Server.startServer()
        })
        let password = Setting.updatePassword(setting[Setting.Password])
        let authEnable = Setting.updateAuthEnable(setting[Setting.AuthEnable])
        let tusEnable = Setting.updateTusEnable(setting[Setting.tusEnableKey])
        let chunkSize = Setting.updateChunkSize(setting[Setting.chunkSizeKey])
        Promise.all([updateUploadPath, updatePort, password, authEnable, tusEnable, chunkSize])
            .then((msg) => {
                resolve(msg)
            })
            .catch((e) => {
                console.log(e)
                reject(e)
            })
    })
}

const openFile = (filename) => {
    let file = FileDb.getFile(filename)
    FileUtil.openFile(file.path)
}

window.api = {
    updateSetting,
    getSetting: Setting.getSetting,
    startServer: Server.startServer,
    stopServer: Server.stopServer,
    getServerStatus: Server.getServerStatus,
    openFile,
    registryEventListener: EventDispatcher.registryEventListener,
    addText: FileDb.addText,
    addFile: FileDb.addFile,
    removeFile: FileDb.removeFile,
    listFiles: FileDb.listFiles,
    updateIp: Setting.updateIp,
    getUrl: Setting.getUrl,
    getIpAddress: IpUtil.getIpAddress,
    getIpAddresses: IpUtil.getIpAddresses,
    getNetInterfaceNames: IpUtil.getNetInterfaceNames,
    getSystemToken: Server.getSystemToken
}
