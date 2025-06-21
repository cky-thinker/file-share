const { spawn } = require('child_process');

/**
 * Opens the Explorer and executes the callback function in osX
 * @param {string} path The path string to be opened in the explorer
 * @param {Function} callback Callback function to which error is passed if some error occurs
 */
function openExplorerinMac(path, callback) {
    path = path || '/';
    let p = spawn('open', [path]);
    p.on('error', (err) => {
        p.kill();
        return callback(err);
    });
}

module.exports = openExplorerinMac;