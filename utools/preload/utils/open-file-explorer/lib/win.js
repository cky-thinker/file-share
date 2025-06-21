const { spawn } = require('child_process');

/**
 * Opens the Explorer and executes the callback function in windows os
 * @param {string} path The path string to be opened in the explorer
 * @param {Function} callback Callback function to which error is passed if some error occurs
 */
function openExplorerinWindows(path, callback) {
    path = path || '=';
    let p = spawn('explorer', [path]);
    p.on('error', (err) => {
        p.kill();
        return callback(err);
    });
}

module.exports = openExplorerinWindows;