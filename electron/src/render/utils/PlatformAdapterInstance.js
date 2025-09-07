const PlatformAdaptor = require('./PlatformAdaptor')
const { Database } = require('@file-share/shared-utils');
const { machineId } = require('node-machine-id')

// 设置数据库适配器
class ElectronDatabaseAdapter {
    setStorageItem(key, value, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return PlatformAdaptor.dbStorage.setItem(key, value)
    }

    getStorageItem(key, defaultValue = null, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return PlatformAdaptor.dbStorage.getItem(key) || defaultValue
    }

    removeStorageItem(key, machineUnique = false) {
        if (machineUnique) {
            const id = machineId(true)
            key = `${key}_${id}`
        }
        return PlatformAdaptor.dbStorage.removeItem(key)
    }
}

// 设置适配器
Database.setAdapter(new ElectronDatabaseAdapter())

module.exports = PlatformAdaptor