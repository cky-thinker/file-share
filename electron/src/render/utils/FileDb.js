const fs = require("fs")
const path = require("path")
const nodeMachine = require('node-machine-id');

const EventDispatcher = require('./EventDispatcher')
const AppDatabase = require('./Database')

let machineId = null;
function getMachineId() {
    if (machineId == null) {
        machineId = nodeMachine.machineIdSync();
    }
    return machineId;
}

function getFileDBKey() {
    return "FileDb:" + getMachineId();
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
        // 文件名称重复的，添加后缀去重
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

const addText = (text, username) => {
    console.log("--- addText ---", text);
    console.log("--- username ---", username);
    // 取文本前10位为名称
    let name = text.substring(0, Math.min(20, text.length));
    let intro = text.substring(0, Math.min(100, text.length));
    if (text.length > 20) {
        name += '...'
    }
    let textBody = {type: 'text', name: name, content: text, intro, username: username}
    addFileToDb(textBody.name, textBody)
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

const removeFile = (file) => {
    console.log("removeFile: " + file.name);
    removeFileToDb(file.name)
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
}

const listFiles = () => {
    return Object.values(getFileDb());
}

const getFile = (fileName) => {
    return getFileDb()[fileName]
}

exports.addFile = addFile
exports.addText = addText
exports.removeFile = removeFile
exports.listFiles = listFiles
exports.getFile = getFile
