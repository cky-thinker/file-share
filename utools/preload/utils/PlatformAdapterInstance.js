const { Database } = require('@file-share/shared-utils');
const { machineId } = require('node-machine-id')

// 区分不同设备的存储
let nodeId = null;
function getMachineId() {
    if (nodeId == null) {
        nodeId = machineId(true);
    }
    return nodeId;
}

// 设置数据库适配器
class UtoolsDatabaseAdapter {
    getStorageItem(key, defaultValue = null, machineUnique = true) {
        if (key.indexOf(":") === -1 && machineUnique) {
            key = key + ":" + getMachineId();
        }
        let value = utools.dbStorage.getItem(key);
        // 存在直接返回
        if (value !== undefined && value !== null) {
            return value;
        }
        // 不存在且没有默认值
        if (defaultValue === undefined || defaultValue === null) {
            return null;
        }
        // 使用默认值
        if (typeof defaultValue === "function") {
            defaultValue = defaultValue();
        }
        self.setStorageItem(key, defaultValue, machineUnique);
        return defaultValue;
    }

    setStorageItem(key, value, machineUnique = true) {
        if (key.indexOf(":") === -1 && machineUnique) {
            key = key + ":" + getMachineId();
        }
        utools.dbStorage.setItem(key, value);
    }

    removeStorageItem(key, machineUnique = true) {
        if (key.indexOf(":") === -1 && machineUnique) {
            key = key + ":" + getMachineId();
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
