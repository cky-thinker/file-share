// 跨平台适配器
const { ipcRenderer } = require('electron');
const { Database } = require('@file-share/shared-utils');
const { machineId } = require('node-machine-id')

// 持久化存储（基于 localStorage，跨会话保留），JSON 序列化以保留原始数据类型
let dbStorage = {
    setItem: function (key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    },
    getItem: function (key) {
        const value = localStorage.getItem(key)
        if (value === null || value === undefined) {
            return null
        }
        try {
            return JSON.parse(value)
        } catch (e) {
            return value
        }
    },
    removeItem: function (key) {
        localStorage.removeItem(key)
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
    getVersion: () => {
        return ipcRenderer.invoke('get-app-version')
    },
    openExternal: (url) => {
        return ipcRenderer.invoke('open-external', url)
    },
    initDatabaseAdapter: () => {
        // 设置适配器
        Database.setAdapter(new ElectronDatabaseAdapter())
    }
}

module.exports = PlatformAdapter