const fs = require("fs")
const path = require("path")

const EventDispatcher = require('./EventDispatcher')
const AppDatabase = require('./Database')
const FileDbKey = "FileDb";

function getFileDBKey() {
    return FileDbKey;
}

const addFileToDb = (fileName, fileInfo) => {
    let fileDb = getFileDb();
    fileDb[fileName] = fileInfo
    AppDatabase.setStorageItem(getFileDBKey(), JSON.stringify(fileDb))
}

const removeFileToDb = (fileName) => {
    let fileDb = getFileDb();
    delete fileDb[fileName]
    AppDatabase.setStorageItem(getFileDBKey(), JSON.stringify(fileDb))
}

const getFileDb = () => {
    let fileDbStr = AppDatabase.getStorageItem(getFileDBKey(), "{}")
    return JSON.parse(fileDbStr);
}

const addFile = (file) => {
    console.log("--- addFile ---", file);
    if (fs.lstatSync(file.path).isDirectory()) {
        let filename = file.path.substr(file.path.lastIndexOf(path.sep) + 1)
        let finalFilename = filename
        let suffix = 1
        let fileDb = getFileDb();
        while (fileDb[finalFilename] && fileDb[finalFilename].path !== file.path) {
            finalFilename = filename + '_' + suffix++
        }
        console.log(finalFilename, "finalFilename")
        addFileToDb(finalFilename, {type: 'directory', name: finalFilename, path: file.path, username: file.username})
    } else {
        addFileToDb(file.name, {type: 'file', name: file.name, path: file.path, username: file.username})
    }
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

const addText = (text, username, nickname) => {
    console.log("--- addText ---", text);
    console.log("--- username ---", username);
    let name = text.substring(0, Math.min(20, text.length));
    let intro = text.substring(0, Math.min(100, text.length));
    if (text.length > 20) {
        name += '...'
    }
    let textBody = {type: 'text', name, displayName: name, content: text, intro, username, nickname}
    // 聊天内容可能重复，生成唯一 key 避免同名相互覆盖
    let key = name
    let suffix = 1
    let fileDb = getFileDb();
    while (fileDb[key]) {
        key = name + '_' + suffix++
    }
    textBody.name = key
    addFileToDb(key, textBody)
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

/**
 * 添加新建的文件夹到分享数据库（根目录新建文件夹使用）
 * @param {string} name 文件夹名称
 * @param {string} dirPath 文件夹真实路径
 * @param {string} username 创建者
 */
const addDirectory = (name, dirPath, username) => {
    addFileToDb(name, {type: 'directory', name, path: dirPath, username})
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

const removeFile = (file) => {
    console.log("removeFile: " + file.name);
    removeFileToDb(file.name)
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
}

const listFiles = () => {
    let fileDb = getFileDb()
    // 为旧数据补齐排序序号（保持插入顺序），有变化时持久化
    if (ensureOrder(fileDb)) {
        AppDatabase.setStorageItem(getFileDBKey(), JSON.stringify(fileDb))
    }
    return sortedValues(fileDb)
}

/**
 * 为缺少排序序号的条目补齐序号（保持插入顺序）
 * @returns {boolean} 是否有修改
 */
const ensureOrder = (fileDb) => {
    let max = 0
    let changed = false
    Object.values(fileDb).forEach(f => {
        if (typeof f.sort === 'number' && f.sort > max) {
            max = f.sort
        }
    })
    Object.values(fileDb).forEach(f => {
        if (typeof f.sort !== 'number') {
            max += 1
            f.sort = max
            changed = true
        }
    })
    return changed
}

/**
 * 展示排序：置顶优先，其余按自定义序号（即加入顺序）
 */
const sortedValues = (fileDb) => {
    return Object.values(fileDb).sort((a, b) => {
        let pa = a.pinned === true
        let pb = b.pinned === true
        if (pa !== pb) {
            return pa ? -1 : 1
        }
        return (typeof a.sort === 'number' ? a.sort : 0) - (typeof b.sort === 'number' ? b.sort : 0)
    })
}

/**
 * 置顶 / 取消置顶
 * @param {string} name 条目名称（FileDb key）
 * @param {boolean} pinned
 */
const pinFile = (name, pinned) => {
    let fileDb = getFileDb()
    if (!fileDb[name]) {
        return {success: false, message: '条目不存在'}
    }
    ensureOrder(fileDb)
    fileDb[name].pinned = pinned === true
    AppDatabase.setStorageItem(getFileDBKey(), JSON.stringify(fileDb))
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true}
}

/**
 * 自定义排序：按展示顺序上下移动
 * @param {string} name 条目名称（FileDb key）
 * @param {number} offset -1 上移 / 1 下移
 */
const moveFile = (name, offset) => {
    let fileDb = getFileDb()
    if (!fileDb[name]) {
        return {success: false, message: '条目不存在'}
    }
    ensureOrder(fileDb)
    let files = sortedValues(fileDb)
    let idx = files.findIndex(f => f.name === name)
    let targetIdx = idx + (offset >= 0 ? 1 : -1)
    if (idx === -1 || targetIdx < 0 || targetIdx >= files.length) {
        return {success: false, message: '已无法移动'}
    }
    let tmp = files[idx].sort
    files[idx].sort = files[targetIdx].sort
    files[targetIdx].sort = tmp
    AppDatabase.setStorageItem(getFileDBKey(), JSON.stringify(fileDb))
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true}
}

const getFile = (fileName) => {
    return getFileDb()[fileName]
}

exports.addFile = addFile
exports.addText = addText
exports.addDirectory = addDirectory
exports.removeFile = removeFile
exports.listFiles = listFiles
exports.getFile = getFile
exports.pinFile = pinFile
exports.moveFile = moveFile