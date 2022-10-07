const path = require('path')
const fs = require('fs');
const openExplorer = require('open-file-explorer');

const DEFAULT_HANDLER = (err) => console.log(err)

const openFile = (filePath, errorHandler = DEFAULT_HANDLER) => {
    let fileDir = filePath;
    // 如果路径是文件，打开文件所在文件夹
    if (!fs.lstatSync(filePath).isDirectory()) {
        fileDir = path.dirname(filePath)
    }
    openExplorer(fileDir, err => {
        if (err) {
            errorHandler(err)
        } else {
            console.log('file explore open: ' + filePath)
        }
    });
}

const listFiles = (fileDir) => {
    console.log(fileDir)
    // path no directory
    if (!fs.lstatSync(fileDir).isDirectory()) {
        throw new Error("file is not directory")
    }
    // path not exists
    if (!fs.existsSync(fileDir)) {
        throw new Error("file not exists")
    }
    let files = []
    fs.readdirSync(fileDir).forEach(file => {
        console.log(file);
        let fileAbsPath = path.join(fileDir, file);
        if (fs.lstatSync(fileAbsPath).isDirectory()) {
            files.push({type: 'directory', name: file, path: fileAbsPath})
        } else {
            files.push({type: 'file', name: file, path: fileAbsPath})
        }
    });
    return files;
}

exports.openFile = openFile
exports.listFiles = listFiles