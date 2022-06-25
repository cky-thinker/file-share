const path = require('path')
const fs = require("fs")

const IpUtil = require('./utils/IpUtil')
const Setting = require('./utils/Setting')
const Server = require('./utils/Server')
const FileUtil = require('./utils/FileUtil')
const FileDb = require('./utils/FileDb')
const EventDispatcher = require('./utils/EventDispatcher')

// 进入插件
utools.onPluginEnter(({code, type, payload}) => {
    if (type === 'files' && !!payload) {
        console.log("快捷方式进入插件", payload)
        payload.forEach((toAddFile) => {
            if (toAddFile.isFile) {
                FileDb.addFile(toAddFile)
            }
        })
        if (Server.getServerStatus() === Server.StatusStop) {
            Server.startServer()
        }
    }
})

// 退出插件
utools.onPluginOut(() => {
    console.log('用户退出插件')
})

// 插件装配
utools.onPluginReady(() => {
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
        Promise.all([updateUploadPath, updatePort])
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
    getNetInterfaceNames: IpUtil.getNetInterfaceNames
}