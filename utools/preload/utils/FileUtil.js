const path = require('path')
const openExplorer = require('open-file-explorer');

const DEFAULT_HANDLER = (err) => console.log(err)

const openFile = (filePath, errorHandler = DEFAULT_HANDLER) => {
    let fileDir = path.dirname(filePath)
    openExplorer(fileDir, err => {
        if (err) {
            errorHandler(err)
        } else {
            console.log('file explore open: ' + filePath)
        }
    });
}

exports.openFile = openFile