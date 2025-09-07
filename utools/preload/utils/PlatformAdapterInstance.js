const { Database } = require('@file-share/shared-utils');
const { machineId } = require('node-machine-id')

// 设置数据库适配器
class UtoolsDatabaseAdapter {
    setStorageItem(key, value, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return utools.dbStorage.setItem(key, value)
    }

    getStorageItem(key, defaultValue = null, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return utools.dbStorage.getItem(key) || defaultValue
    }

    removeStorageItem(key, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return utools.dbStorage.removeItem(key)
    }
}


// 创建平台适配器对象
const PlatformAdapter = {
    dbStorage: utools.dbStorage,
    onPluginEnter: utools.onPluginEnter,
    onPluginOut: utools.onPluginOut,
    onPluginReady: utools.onPluginReady,
    openDevTool: () => {
        console.log("not supported")
    },
    closeDevTool: () => {
        console.log("not supported")
    },
    getPlatform: () => {
        return 'utools'
    },
    initDatabaseAdapter: () => {
        // 设置适配器
        Database.setAdapter(new UtoolsDatabaseAdapter())
    }
}

module.exports = PlatformAdapter
