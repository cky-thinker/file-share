let _setImmediate = setTimeout;
process.once('loaded', function () {
    global.setImmediate = _setImmediate;
});
const path = require('path')
const fs = require("fs")

const IpUtil = require('./utils/IpUtil')
const Setting = require('./utils/Setting')
const Server = require('./utils/Server')
const FileUtil = require('./utils/FileUtil')
const FileDb = require('./utils/FileDb')
const EventDispatcher = require('./utils/EventDispatcher')

// 进入插件
utools.onPluginEnter(({ code, type, payload }) => {
    let checkStart = false;
    if (type === 'files' && !!payload) {
        console.log("快捷方式进入插件", payload)
        payload.forEach((toAddFile) => {
            if (toAddFile.isFile) {
                FileDb.addFile(toAddFile)
            }
        })
        checkStart = true;
    } else if (type === 'over') {
        console.log('文本分享方式进入插件', payload)
        if (payload) {
            FileDb.addText(payload)
        }
        checkStart = true;
    } else if (Setting.getAutoStart()) {
        checkStart = true;
    }
    if (checkStart && Server.getServerStatus() === Server.StatusStop) {
        Server.startServer()
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

    // 初始化IP相关配置
    const savedIpFamily = IpUtil.getIpFamily();
    const savedNetInterface = IpUtil.getNetInterface();
    const ipAddress = IpUtil.getIp();
    console.log('加载保存的IP配置:', { ipFamily: savedIpFamily, netInterface: savedNetInterface, ipAddress: ipAddress });
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
        let autoStart = Setting.updateAutoStart(setting[Setting.AutoStart])
        return Promise.all([updateUploadPath, updatePort, password, authEnable, tusEnable, chunkSize, autoStart])
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
    getUrl: Setting.getUrl,
    startServer: Server.startServer,
    stopServer: Server.stopServer,
    getServerStatus: Server.getServerStatus,
    openFile,
    registryEventListener: EventDispatcher.registryEventListener,
    addText: FileDb.addText,
    addFile: FileDb.addFile,
    removeFile: FileDb.removeFile,
    listFiles: FileDb.listFiles,
    getIp: IpUtil.getIp,
    getIpAddress: IpUtil.getIpAddress,
    getIpAddresses: IpUtil.getIpAddresses,
    getNetInterfaceNames: IpUtil.getNetInterfaceNames,
    setIpFamily: IpUtil.setIpFamily,
    setNetInterface: IpUtil.setNetInterface,
    getIpFamily: IpUtil.getIpFamily,
    getNetInterface: IpUtil.getNetInterface,
    getSystemToken: Server.getSystemToken,
    getPlatform: () => {
        return 'utools'
    },
    openDevTool: () => {
        console.log("not supported")
    },
    closeDevTool: () => {
        console.log("not supported")
    }
}
