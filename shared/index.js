// Main entry point for shared utilities
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