// ----- 数据库接口封装 k-v 存储 -----
// 这是一个基础接口，需要由具体平台实现

class DatabaseAdapter {
    constructor(platformStorage) {
        this.platformStorage = platformStorage;
    }

    setStorageItem(key, value) {
        throw new Error('setStorageItem must be implemented by platform adapter');
    }

    getStorageItem(key, defaultValue = null) {
        throw new Error('getStorageItem must be implemented by platform adapter');
    }
}

// 默认实现，需要在具体平台中重写
let adapter = null;

function setAdapter(platformAdapter) {
    adapter = platformAdapter;
}

function setStorageItem(key, value) {
    if (!adapter) {
        throw new Error('Database adapter not initialized');
    }
    return adapter.setStorageItem(key, value);
}

function getStorageItem(key, defaultValue = null) {
    if (!adapter) {
        throw new Error('Database adapter not initialized');
    }
    return adapter.getStorageItem(key, defaultValue);
}

exports.DatabaseAdapter = DatabaseAdapter;
exports.setAdapter = setAdapter;
exports.setStorageItem = setStorageItem;
exports.getStorageItem = getStorageItem;