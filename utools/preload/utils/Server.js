const path = require('path')
const express = require('express') // http://expressjs.com/
const multer = require('multer')
const bodyParser = require("body-parser");

const Setting = require('./Setting')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')

// 服务状态
const StatusStart = "start"
const StatusStop = "stop"

let server;
let status = StatusStop;


// 服务初始化
const initApp = () => {
    let app = express();
    let rootPath = path.resolve(__dirname, '..')
    app.use(express.static(path.join(rootPath, 'web'), {index: 'download.html'}))
    // 获取文件列表
    app.get('/files', function (req, res) {
        res.json({files: FileDb.listFiles()});
    });
    // 下载文件
    app.get('/download/:name', function (req, res) {
        let filename = req.params.name
        let filePath = FileDb.getFile(filename).path;
        console.log("send file: " + filePath);
        res.download(filePath)
    });

    // 通过 filename 属性定制
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, Setting.getUploadPath());    // 保存的路径，备注：需要自己创建
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
        FileDb.addFile({name: file.originalname, path: file.path})
        res.redirect('/')
    })

    // 上传文本
    const urlencodedParser = bodyParser.urlencoded({extended: false});
    app.post('/addText', urlencodedParser, function (req, res, next) {
        let text = req.body.message
        FileDb.addText(text)
        res.redirect('/')
    })

    return app;
}

// 开启服务
const startServer = () => {
    let port = Setting.getPort();
    const app = initApp()
    console.log("startServer", port)
    server = app.listen(port, () => {
        console.log("start success! download url: " + Setting.getUrl())
        status = StatusStart;
        EventDispatcher.triggerEvent({type: 'server.statusChange', data: {status: StatusStart}})
    });
    return {success: true, message: "启动成功", url: Setting.getUrl()};
}

// 关闭服务
const stopServer = () => {
    server.close();
    status = StatusStop;
    EventDispatcher.triggerEvent({type: 'server.statusChange', data: {status: StatusStop}})
}

const getServerStatus = () => {
    return status;
}

exports.startServer = startServer
exports.stopServer = stopServer
exports.getServerStatus = getServerStatus
exports.StatusStart = StatusStart
exports.StatusStop = StatusStop