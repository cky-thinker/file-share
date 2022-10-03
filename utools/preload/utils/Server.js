const path = require('path')
const crypto = require('crypto');
const express = require('express') // http://expressjs.com/
const cookieParser = require('cookie-parser');
const multer = require('multer')
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});

const Setting = require('./Setting')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')

let session = new Set()

const StatusStart = "start"
const StatusStop = "stop"

let server;
let status = StatusStop;


function authFilter(req, res, next) {
    console.log('authFilter', req)
    // no auth
    if (!Setting.getAuthEnable()) {
        console.log('no auth')
        next()
        return;
    }
    // white list
    if (req.url === '/' ||
        req.url === '/index.html' ||
        req.url === '/favicon.ico' ||
        req.url === '/api/auth' ||
        req.url.startsWith('/static')) {
        next()
        return;
    }
    // validate
    if (session.has(req.headers['Authorization'])) {
        next()
    } else {
        res.json({code: 401, message: '认证失败'})
        res.end();
    }
}

const initApp = () => {
    let app = express();
    app.use(cookieParser());
    app.use(authFilter);
    let rootPath = path.resolve(__dirname, '..')
    app.use(express.static(path.join(rootPath, 'web'), {index: 'index.html'}))
    app.use(bodyParser.json())
    // file list
    app.get('/api/files', function (req, res) {
        res.json({code: 200, data: FileDb.listFiles()});
    });
    // download
    app.get('/api/download', function (req, res) {
        let filename = req.query.filename
        console.log('/api/download', filename)
        let file = FileDb.getFile(filename);
        if (!file) {
            res.sendStatus(404);
            return;
        }
        let filePath = file.path;
        console.log("send file: " + filePath);
        res.download(filePath)
    });

    app.post('/api/auth', urlencodedParser, function (req, res) {
        // no auth
        if (!Setting.getAuthEnable()) {
            res.json({code: 200, message: 'success'})
            return;
        }
        // password error
        let password = req.body.password
        if (Setting.getPassword() !== password) {
            res.json({code: 403, message: '密码错误'})
            return;
        }
        // update auth
        let md5 = crypto.createHash('md5');
        let token = md5.update(password).digest('hex');
        l
        session.add(token)
        res.json({code: 200, data: {Authorization: token}, message: 'success'})
    });

    //filename
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, Setting.getUploadPath());
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    });

    let upload = multer({storage: storage});
    app.post('/api/addFile', upload.single('file'), function (req, res, next) {
        let file = req.file;
        FileDb.addFile({name: file.originalname, path: file.path})
        res.redirect('/')
    })

    app.post('/api/addText', urlencodedParser, function (req, res, next) {
        console.log(req)
        let text = req.body.message
        if (!text) {
            res.json({code: 500, message: '消息不能为空'})
            return;
        }
        FileDb.addText(text)
        res.json({code: 200, message: '添加成功'})
    })

    return app;
}

const startServer = () => {
    let port = Setting.getPort();
    const app = initApp()
    console.log("startServer", port)
    server = app.listen(port, () => {
        console.log("start success! download url: " + Setting.getUrl())
        status = StatusStart;
        EventDispatcher.triggerEvent({type: 'server.statusChange', data: {status: StatusStart}})
    });
    return {success: true, message: "服务启动成功", url: Setting.getUrl()};
}

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