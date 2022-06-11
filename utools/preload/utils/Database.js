// ----- 数据库接口封装 k-v 存储 -----
function setStorageItem(key, value) {
    utools.dbStorage.setItem(key, value);
}

function getStorageItem(key, defaultValue = null) {
    let value = utools.dbStorage.getItem(key);
    // 存在直接返回
    if (!!value) {
        return value;
    }
    // 不存在且没有默认值
    if (!defaultValue) {
        return null;
    }
    // 使用默认值
    if (!!defaultValue && typeof defaultValue === 'function') {
        defaultValue = defaultValue()
    }
    setStorageItem(key, defaultValue);
    return defaultValue;
}

exports.setStorageItem = setStorageItem
exports.getStorageItem = getStorageItem