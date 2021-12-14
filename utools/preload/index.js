const path = require('path')
const express = require('express') // http://expressjs.com/
const IpUtil = require('./utils/IpUtil')
const fs = require("fs")
const multer = require('multer')
const bodyParser = require("body-parser");
const openExplorer = require('open-file-explorer');

let fileDb = new Map();
let server;

const updateUploadPath = (path) => {
    console.log("updateUploadPath: " + path);
    if (!fs.existsSync(path)) {
        return {success: false, message: '文件夹不存在'}
    }
    if (!fs.lstatSync(path).isDirectory()) {
        return {success: false, message: '上传路径必须为文件夹'}
    }
    utools.dbStorage.setItem('uploadPath', path);
    return {success: true, message: '修改成功'}
}

const getSettings = () => {
    return {uploadPath: utools.dbStorage.getItem('uploadPath')};
}

const uploadPath = 'uploadPath'
const initSettings = () => {
    console.log('initSettings')
    let newPath = utools.dbStorage.getItem('uploadPath')
    if (newPath != null) {
        return;
    }
    let USER_HOME = process.env.HOME || process.env.USERPROFILE
    let fileDownload = path.join(USER_HOME, 'Downloads')
    updateUploadPath(fileDownload)
}

utools.onPluginReady(() => {
    console.log('插件装配完成，已准备好')
    initSettings();
})

const getFileDownload = () => {
    return getSettings()[uploadPath]
}

// 服务初始化
const initApp = () => {
    let app = express();
    app.use(express.static(path.join(__dirname, 'web'), {index: 'download.html'}))
    // 获取文件列表
    app.get('/files', function (req, res) {
        let files = Array.from(fileDb.values());
        res.json({files: files});
    });
    // 下载文件
    app.get('/download/:name', function (req, res) {
        let filename = req.params.name
        let filePath = fileDb.get(filename).path;
        console.log("send file: " + filePath);
        res.download(filePath)
    });

    // 通过 filename 属性定制
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, getFileDownload());    // 保存的路径，备注：需要自己创建
        },
        filename: function (req, file, cb) {
            // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
            cb(null, file.originalname);
        }
    });

    // 上传文件api
    let upload = multer({storage: storage});
    app.post('/addFile', upload.single('file'), function (req, res, next) {
        let file = req.file;
        addFile({name: file.originalname, path: file.path})
        res.redirect('/')
    })

    // 上传文本
    const urlencodedParser = bodyParser.urlencoded({extended: false});
    app.post('/addText', urlencodedParser, function (req, res, next) {
        let text = req.body.message
        addText(text)
        res.redirect('/')
    })

    return app;
}

const genUrl = (ip, port = 5421) => {
    return `http://${ip}:${port}`;
}

// 开启服务
const startServer = (port = 5421) => {
    const app = initApp()
    let url = genUrl(IpUtil.getIpAddress(), port);
    server = app.listen(port, () => {
        console.log("start success! download url: " + url)
    });
    return {success: true, message: "启动成功", url: url};
}

// 关闭服务
const stopServer = () => {
    server.close();
}


const DEFAULT_HANDLER = (err) => console.log(err)
const openFile = (filename, errorHandler = DEFAULT_HANDLER) => {
    let file = fileDb.get(filename);
    let fileDir = path.dirname(file.path)
    openExplorer(fileDir, err => {
        if (err) {
            errorHandler(err)
        } else {
            console.log('打开成功：' + file.path)
        }
    });
}

const addFile = (file) => {
    console.log("addFile: " + file);
    if (fs.lstatSync(file.path).isDirectory()) {
        return {success: false, message: '不能选择文件夹'}
    }
    fileDb.set(file.name, {type: 'file', name: file.name, path: file.path})
    return {success: true};
}

const addText = (text) => {
    console.log("addText: " + text);
    // 取文本前10位为名称
    let name = text.substring(0, Math.min(10, text.length));
    if (text.length > 10) {
        name += '...'
    }
    let textBody = {type: 'text', name: name, content: text}
    fileDb.set(textBody.name, textBody)
    return {success: true};
}

const removeFile = (file) => {
    console.log("removeFile: " + file);
    fileDb.delete(file.name)
}

const listFiles = () => {
    return Array.from(fileDb.values());
}

// 本地测试: export NODE_ENV='test' && node index.js
if (process.env.NODE_ENV === "test") {
    let userHome = process.env.HOME || process.env.USERPROFILE;
    let testDir = path.join(userHome, "test");
    let file1 = path.join(testDir, "test1.txt");
    let file2 = path.join(testDir, "test2.txt");
    let file3 = path.join(testDir, "test3.txt");
    fs.mkdirSync(testDir, {recursive: true});
    fs.writeFileSync(file1, "test1");
    fs.writeFileSync(file2, "test2");
    fs.writeFileSync(file3, "test3");
    addFile({name: "test1.txt", path: file1});
    addFile({name: "test2.txt", path: file2});
    addFile({name: "test3.txt", path: file3});
    startServer();
} else {
    window.api = {
        updateUploadPath,
        getSettings,
        addText,
        startServer,
        stopServer,
        openFile,
        addFile,
        removeFile,
        listFiles,
        genUrl,
        getIpAddress: IpUtil.getIpAddress,
        getIpAddresses: IpUtil.getIpAddresses,
        getNetInterfaceNames: IpUtil.getNetInterfaceNames
    }
}
