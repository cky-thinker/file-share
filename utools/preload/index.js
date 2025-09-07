let _setImmediate = setTimeout;
process.once('loaded', function () {
    global.setImmediate = _setImmediate;
});
const path = require('path')
const fs = require("fs")

const { IpUtil, FileUtil, Setting, Server, FileDb, EventDispatcher } = require('@file-share/shared-utils');
const PlatformAdapter = require('./utils/PlatformAdapterInstance');

// 创建Setting实例
const setting = new Setting(PlatformAdapter, IpUtil)

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
    } else if (setting.getAutoStart()) {
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
    setting.getSetting(); // 初始化配置

    // 初始化IP相关配置
    const savedIpFamily = IpUtil.getIpFamily();
    const savedNetInterface = IpUtil.getNetInterface();
    const ipAddress = IpUtil.getIp();
    console.log('加载保存的IP配置:', { ipFamily: savedIpFamily, netInterface: savedNetInterface, ipAddress: ipAddress });
})

// 配置更新
const updateSetting = (setting) => {
    return new Promise((resolve, reject) => {
        let updateUploadPath = setting.updateUploadPath(setting[setting.uploadPathKey]);
        let updatePort = setting.updatePort(setting[setting.portKey]).then((result) => {
            if (result.message === 'ValueNotChange') {
                console.log("端口未变更")
                return;
            }
            // 端口更新成功后重启服务
            Server.stopServer();
            Server.startServer()
        })
        let password = setting.updatePassword(setting[setting.Password])
        let authEnable = setting.updateAuthEnable(setting[setting.AuthEnable])
        let tusEnable = setting.updateTusEnable(setting[setting.tusEnableKey])
        let chunkSize = setting.updateChunkSize(setting[setting.chunkSizeKey])
        let autoStart = setting.updateAutoStart(setting[setting.AutoStart])
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
    getSetting: setting.getSetting,
    getUrl: setting.getUrl,
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
    getToken: Server.getToken,
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
