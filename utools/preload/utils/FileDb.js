const fs = require("fs")
const EventDispatcher = require('./EventDispatcher')

let fileDb = new Map();

const addFile = (file) => {
    console.log("--- addFile ---", file);
    if (fs.lstatSync(file.path).isDirectory()) {
        return {success: false, message: '不能选择文件夹'}
    }
    fileDb.set(file.name, {type: 'file', name: file.name, path: file.path})
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

const addText = (text) => {
    console.log("--- addText ---", text);
    // 取文本前10位为名称
    let name = text.substring(0, Math.min(20, text.length));
    let intro = text.substring(0, Math.min(100, text.length));
    if (text.length > 20) {
        name += '...'
    }
    let textBody = {type: 'text', name: name, content: text, intro}
    fileDb.set(textBody.name, textBody)
    EventDispatcher.triggerEvent({type: 'fileDb.listChange'})
    return {success: true};
}

const removeFile = (file) => {
    console.log("removeFile: " + file);
    fileDb.delete(file.name)
}

const listFiles = () => {
    return Array.from(fileDb.values());
}

const getFile = (fileName) => {
    return fileDb.get(fileName)
}

exports.addFile = addFile
exports.addText = addText
exports.removeFile = removeFile
exports.listFiles = listFiles
exports.getFile = getFile