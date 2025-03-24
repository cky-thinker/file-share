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
