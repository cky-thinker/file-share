const nodeMachine = require('node-machine-id');

// 区分不同设备的存储
let machineId = null;
function getMachineId() {
    if (machineId == null) {
        machineId = nodeMachine.machineIdSync();
    }
    return machineId;
}

// ----- 数据库接口封装 k-v 存储 -----
function getStorageItem(key, defaultValue = null, machineUnique = true) {
    if (machineUnique) {
        key = key + ":" + getMachineId();
    }
    let value = utools.dbStorage.getItem(key);
    // 存在直接返回
    if (!!value) {
        return value;
    }
    // 不存在且没有默认值
    if (defaultValue == null) {
        return null;
    }
    // 使用默认值
    if (!!defaultValue && typeof defaultValue === 'function') {
        defaultValue = defaultValue()
    }
    setStorageItem(key, defaultValue);
    return defaultValue;
}

function setStorageItem(key, value, machineUnique = true) {
    if (machineUnique) {
        key = key + ":" + getMachineId();
    }
    utools.dbStorage.setItem(key, value);
}

exports.setStorageItem = setStorageItem
exports.getStorageItem = getStorageItem