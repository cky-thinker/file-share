let _setImmediate = setTimeout;
// Fix
process.once('loaded', function () {
    global.setImmediate = _setImmediate;
});
require('../common/globalSetting')
// 初始化适配器
const PlatformAdapter = require('./utils/PlatformAdapterInstance')
const { IpUtil, FileUtil, Setting, Server, FileDb, EventDispatcher } = require('@file-share/shared-utils')
PlatformAdapter.initDatabaseAdapter()

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
    setIpFamily: IpUtil.setIpFamily,
    setNetInterface: IpUtil.setNetInterface,
    getIpFamily: IpUtil.getIpFamily,
    getNetInterface: IpUtil.getNetInterface,
    getPlatform: PlatformAdapter.getPlatform,
    openDevTool: PlatformAdapter.openDevTool,
    closeDevTool: PlatformAdapter.closeDevTool
}
