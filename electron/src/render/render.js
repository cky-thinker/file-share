let _setImmediate = setTimeout;
// Fix
process.once("loaded", function () {
  global.setImmediate = _setImmediate;
});
require("../common/globalSetting");
// 初始化适配器
const PlatformAdapter = require("./utils/PlatformAdapterInstance");
const {
  IpUtil,
  FileUtil,
  Setting,
  Server,
  FileDb,
  Account,
  EventDispatcher,
} = require("@file-share/shared-utils");
PlatformAdapter.initDatabaseAdapter();

// 服务自启
if (Setting.getAutoStart() && Server.getServerStatus() === Server.StatusStop) {
  console.log("服务自启");
  Server.startServer();
}

// 配置更新
const updateSetting = (setting) => {
  let old = Setting.getSetting();
  return Setting.updateSetting(setting)
    .then((msg) => {
      if (old.port !== setting.port) {
        console.log("重启服务", old, setting);
        Server.stopServer();
        Server.startServer();
      }
      return msg;
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });
};

const openFile = (filename) => {
  let file = FileDb.getFile(filename);
  FileUtil.openFile(file.path);
};

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
  getToken: Server.getToken,
  getPlatform: PlatformAdapter.getPlatform,
  openDevTool: PlatformAdapter.openDevTool,
  closeDevTool: PlatformAdapter.closeDevTool,
  listAccounts: Account.listAccounts,
  addAccount: Account.addAccount,
  updateAccount: Account.updateAccount,
  updateAccountPassword: Account.updateAccountPassword,
  removeAccount: Account.removeAccount,
  getVersion: PlatformAdapter.getVersion,
  openExternal: PlatformAdapter.openExternal,
};
