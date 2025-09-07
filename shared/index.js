// Main entry point for shared utilities
const Database = require('./utils/Database');
const EventDispatcher = require('./utils/EventDispatcher');
const FileDb = require('./utils/FileDb');
const FileUtil = require('./utils/FileUtil');
const IpUtil = require('./utils/IpUtil');
const Server = require('./utils/Server');
const SettingModule = require('./utils/Setting');
const SseUtil = require('./utils/SseUtil');
const ZipUtil = require('./utils/ZipUtil');
const openFileExplorer = require('./utils/open-file-explorer');

// Create a Setting class wrapper for backward compatibility
class Setting {
  constructor(platformAdapter, ipUtil) {
    if (platformAdapter && platformAdapter.setPlatformConfig) {
      SettingModule.setPlatformConfig(platformAdapter);
    }
    // Bind all Setting module functions to this instance
    Object.keys(SettingModule).forEach(key => {
      if (typeof SettingModule[key] === 'function') {
        this[key] = SettingModule[key];
      }
    });
  }
}

module.exports = {
  Database,
  EventDispatcher,
  FileDb,
  FileUtil,
  IpUtil,
  Server,
  Setting,
  SettingModule,
  SseUtil,
  ZipUtil,
  openFileExplorer,
  // 便于直接访问utils
  utils: {
    Database,
    EventDispatcher,
    FileDb,
    FileUtil,
    IpUtil,
    Server,
    Setting,
    SettingModule,
    SseUtil,
    ZipUtil,
    openFileExplorer
  }
};