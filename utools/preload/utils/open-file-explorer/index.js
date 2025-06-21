const os = require('os');
let osType = os.type();
const openExplorerinWindows = require('./lib/win');
const openExplorerinLinux = require('./lib/linux');
const openExplorerinMac = require('./lib/mac');

/**
 * Opens the Explorer and executes the callback function
 * @param {string} path The path string to be opened in the explorer
 * @param {Function} callback Callback function to which error is passed if some error occurs
 */
function openExplorer(path, callback) {
    if (osType == 'Windows_NT') {
        openExplorerinWindows(path, callback);
    }
    else if (osType == 'Darwin') {
        openExplorerinMac(path, callback);
    }
    else {
        openExplorerinLinux(path, callback);
    }
}

module.exports = openExplorer;