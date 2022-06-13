const openExplorer = require('open-file-explorer');

const DEFAULT_HANDLER = (err) => console.log(err)

const openFile = (filePath, errorHandler = DEFAULT_HANDLER) => {
    let fileDir = path.dirname(filePath)
    openExplorer(fileDir, err => {
        if (err) {
            errorHandler(err)
        } else {
            console.log('打开成功：' + filePath)
        }
    });
}

exports.openFile = openFile