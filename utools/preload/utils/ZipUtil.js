const path = require("path")
const fs = require("fs")
const archiver = require('archiver');
const FileUtil = require("./FileUtil")


/**
 * @param {String} sourceDir: /some/folder/to/compress
 * @param {String} outPath: /path/to/created.zip
 * @returns {Promise}
 */
const zipDirectory = (sourceDir, outPath) => {
    const archive = archiver('zip', {zlib: {level: 1}});
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve(outPath));
        archive.finalize();
    });
}

exports.zipDirectory = zipDirectory

let finalPath = "/Users/chenkeyu/Downloads";
let fileName = FileUtil.parseFileName(finalPath);
let destZipFile =  path.join(path.parse(finalPath).dir, fileName) + ".zip"

console.log("---finalPath---", finalPath)
console.log("---destZipFile---", destZipFile)
zipDirectory(finalPath, destZipFile).then((file) => {
    console.log("压缩成功", file)
}).catch(error => {
    console.log(error)
})
