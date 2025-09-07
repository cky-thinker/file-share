// 跨平台适配器
const { ipcRenderer } = require('electron');
const { Database } = require('@file-share/shared-utils');
const { machineId } = require('node-machine-id')

let map = {}
let dbStorage = {
    setItem: function (key, value) {
        map[key] = value
    },
    getItem: function (key) {
        return map[key]
    }
}

// 设置数据库适配器
class ElectronDatabaseAdapter {
    setStorageItem(key, value, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return dbStorage.setItem(key, value)
    }

    getStorageItem(key, defaultValue = null, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return dbStorage.getItem(key) || defaultValue
    }

    removeStorageItem(key, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return dbStorage.removeItem(key)
    }
}

// 创建平台适配器对象
const PlatformAdapter = {
    dbStorage: dbStorage,
    onPluginEnter: () => {},
    onPluginOut: () => {},
    onPluginReady: () => {},
    openDevTool: () => {
        ipcRenderer.send('open-dev-tools');
    },
    closeDevTool: () => {
        ipcRenderer.send('close-dev-tools');
    },
    getPlatform: () => {
        return 'electron'
    },
    initDatabaseAdapter: () => {
        // 设置适配器
        Database.setAdapter(new ElectronDatabaseAdapter())
    }
}

module.exports = PlatformAdapter