import '../common/globalSetting'
import setupExceptionHandler, {initExceptionLogger} from "../common/exceptionHandler";
import log from 'electron-log'
import {getLogLevel, getLogPath, getPageAppPath, getPreloadPath, isDev} from "../common/globalSetting";

const {app, BrowserWindow, Menu} = require('electron')
const path = require('node:path')

// NOTE: We only support Linux, macOS and Windows but not BSD nor SunOS.
if (!/^(darwin|win32|linux)$/i.test(process.platform)) {
    process.stdout.write(`Operating system "${process.platform}" is not supported! Please open an issue at "https://github.com/cky-thinker/file-share-desktop".\n`)
    process.exit(1)
}

const initializeLogger = appEnvironment => {
    log.transports.console.level = process.env.NODE_ENV === 'development' ? 'info' : 'error'
    log.transports.rendererConsole = null
    log.transports.file.resolvePath = getLogPath
    log.transports.file.level = getLogLevel()
    log.transports.file.sync = true
    initExceptionLogger()
}

initializeLogger()
setupExceptionHandler()

const createWindow = () => {
    Menu.setApplicationMenu(null)
    console.log("PageAppPath", getPageAppPath())
    console.log("PreloadPath", getPreloadPath())
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "file-share-desktop",
        icon: path.join(__static, 'icon.png'),
        webPreferences: {
            contextIsolation: false,
            webSecurity: false,
            nodeIntegration: true,
            preload: getPreloadPath()
        }
    })

    win.loadFile(getPageAppPath()).then(() => {
        console.log("load success!")
        if (isDev()) {
            win.webContents.openDevTools();
        }
    }).catch(e => {
        console.log("load error", e)
    })
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})