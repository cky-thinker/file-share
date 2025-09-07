const { spawn } = require('child_process');

/**
 * Opens the Explorer and executes the callback function in ubuntu like os
 * @param {string} path The path string to be opened in the explorer
 * @param {Function} callback Callback function to which error is passed if some error occurs
 */
function openExplorerinLinux(path, callback) {
    path = path || '/';
    let p = spawn('xdg-open', [path]);
    p.on('error', (err) => {
        p.kill();
        return callback(err);
    });
}

module.exports = openExplorerinLinux;