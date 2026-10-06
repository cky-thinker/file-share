// Main entry point for shared utilities
const Account = require('./utils/Account');
const Database = require('./utils/Database');
const EventDispatcher = require('./utils/EventDispatcher');
const FileDb = require('./utils/FileDb');
const FileUtil = require('./utils/FileUtil');
const IpUtil = require('./utils/IpUtil');
const Server = require('./utils/Server');
const Setting = require('./utils/Setting');
const SseUtil = require('./utils/SseUtil');
const ZipUtil = require('./utils/ZipUtil');
const openFileExplorer = require('./utils/open-file-explorer');

module.exports = {
  Account,
  Database,
  EventDispatcher,
  FileDb,
  FileUtil,
  IpUtil,
  Server,
  Setting,
  SseUtil,
  ZipUtil,
  openFileExplorer,
  // 便于直接访问utils
  utils: {
    Account,
    Database,
    EventDispatcher,
    FileDb,
    FileUtil,
    IpUtil,
    Server,
    Setting,
    SseUtil,
    ZipUtil,
    openFileExplorer
  }
};