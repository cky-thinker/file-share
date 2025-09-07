// ----- 数据库接口封装 k-v 存储 -----
// 这是一个基础接口，需要由具体平台实现
class DatabaseAdapter {
    constructor() {
    }

    setStorageItem(key, value) {
        throw new Error('setStorageItem must be implemented by platform adapter');
    }

    getStorageItem(key, defaultValue = null) {
        throw new Error('getStorageItem must be implemented by platform adapter');
    }
}

// 默认实现，需要在具体平台中重写
let databaseAdapter = null;

function setAdapter(value) {
    databaseAdapter = value;
}

function setStorageItem(key, value) {
    if (!databaseAdapter) {
        throw new Error('Database adapter not initialized');
    }
    return databaseAdapter.setStorageItem(key, value);
}

function getStorageItem(key, defaultValue = null) {
    if (!databaseAdapter) {
        throw new Error('Database adapter not initialized');
    }
    return databaseAdapter.getStorageItem(key, defaultValue);
}

exports.setAdapter = setAdapter;
exports.setStorageItem = setStorageItem;
exports.getStorageItem = getStorageItem;