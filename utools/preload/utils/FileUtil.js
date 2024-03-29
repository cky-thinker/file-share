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

const parseFileName = (filePath) => {
    let words = filePath.split(path.sep).filter(w => w !== "");
    return words.length > 0 ? words[words.length - 1] : "";
}

const getAllFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, file))
        }
    })
    return arrayOfFiles
}

const getTotalSize = function(directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath)
    let totalSize = 0
    arrayOfFiles.forEach(function(filePath) {
        totalSize += fs.statSync(filePath).size
    })
    return totalSize
}


const convertBytes = function(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) {
        return "n/a"
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    if (i === 0) {
        return bytes + " " + sizes[i]
    }
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}

const getTotalSizeReadable = function(directoryPath) {
    return convertBytes(getTotalSize(directoryPath))
}

exports.openFile = openFile
exports.listFiles = listFiles
exports.parseFileName = parseFileName
exports.getTotalSize = getTotalSize
exports.getTotalSizeReadable = getTotalSizeReadable
