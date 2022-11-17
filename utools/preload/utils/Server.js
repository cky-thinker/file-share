const path = require('path')
const fs = require('fs')
const crypto = require('crypto');
const express = require('express') // http://expressjs.com/
const cookieParser = require('cookie-parser');
const multer = require('multer')
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});
const jsonParser = bodyParser.json()

const Setting = require('./Setting')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')
const FileUtil = require('./FileUtil')

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
        req.url === '/api/login' ||
        req.url.startsWith('/api/download') ||
        req.url.startsWith('/static')) {
        next()
        return;
    }
    // validate
    if (session.has(req.get('Authorization'))) {
        next()
    } else {
        res.json({code: 401, message: '认证失败'})
        res.end();
    }
}

/**
 * 根据文件路径，查询起始的分享文件，并且拼接该文件的路径
 */
function parsePath(filename) {
    if (!filename) {
        return {finalPath: '', filePaths: []}
    }
    // 查询起始分享文件
    let filePaths = filename.split('/').filter(p => !!p && p !== '')
    let startPath = filePaths[0]
    let startFile = FileDb.getFile(startPath);
    if (!startFile) {
        throw new Error("分享列表未找到该文件")
    }
    let filePath = startFile.path;
    console.log('filePath', filePath)
    console.log('filePaths', filePaths)
    // 拼接路径
    let dirname = path.dirname(filePath)
    console.log('prefix', dirname)
    let fullPath = [...filePaths]
    fullPath.unshift(dirname)
    console.log('fullPath', fullPath)
    let finalPath = fullPath.join(path.sep)
    console.log('finalPath', finalPath)
    return {finalPath, filePaths};
}

/**
 * 获取客户端IP
 */
function getClientIp(req) {
    let sourceip = req.ip.match(/\d+\.\d+\.\d+\.\d+/).toString()
    // 获取反向代理记录的真实客户端IP
    let realip = req.headers['x-real-ip']
    let clientip = realip || sourceip
    console.log('sourceip %s, realip %s, clientip %s', sourceip,realip,clientip)
    return clientip;
}

const initApp = () => {
    let app = express();
    app.use(cookieParser());
    app.all("/api/*", authFilter);
    let rootPath = path.resolve(__dirname, '..')
    app.use(express.static(path.join(rootPath, 'web'), {index: 'index.html'}))
    // file list
    app.get('/api/files', function (req, res) {
        let path = req.query.path
        console.log('/api/files', path)
        let finalPath, filePaths;
        try {
            let result = parsePath(path)
            finalPath = result.finalPath
            filePaths = result.filePaths
        } catch (e) {
            res.json({code: 500, message: e.message});
            return;
        }

        if (finalPath.length === 0) {
            res.json({code: 200, data: {path: [], files: FileDb.listFiles()}});
            return;
        }
        return res.json({code: 200, data: {path: filePaths, files: FileUtil.listFiles(finalPath)}});
    });
    // download
    app.get('/api/download', function (req, res) {
        let token = req.query.token
        console.log('/api/download token', token)
        if (Setting.getAuthEnable() && (!token || !session.has(token))) {
            res.sendStatus(403)
            return;
        }

        let filename = req.query.filename
        console.log('/api/download filename', filename)

        let finalPath;
        try {
            finalPath = parsePath(filename).finalPath
            if (!finalPath) {
                console.log("文件路径解析为空")
                res.sendStatus(400);
                return;
            }
        } catch (e) {
            res.sendStatus(404);
            return;
        }
        console.log('finalPath', finalPath)
        if (!fs.existsSync(finalPath)) {
            res.sendStatus(404);
        }

        console.log("send file: " + finalPath);
        res.download(finalPath)
    });

    app.post('/api/login', urlencodedParser, jsonParser, function (req, res) {
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
        let sourceip = getClientIp(req)
        FileDb.addFile({name: file.originalname, path: file.path, username: sourceip})
        res.json({code: 200, message: '添加成功'})
    })

    app.post('/api/addText', jsonParser, function (req, res, next) {
        console.log(req)
        let sourceip = getClientIp(req)
        let text = req.body.message
        if (!text) {
            res.json({code: 500, message: '消息不能为空'})
            return;
        }
        FileDb.addText(text, sourceip)
        res.json({code: 200, message: '添加成功'})
    })

    app.use((req, res, next) => {
        res.redirect('/')
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