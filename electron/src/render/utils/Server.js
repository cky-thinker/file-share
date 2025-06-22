const path = require('path')
const fs = require('fs')
const crypto = require('crypto');
const express = require('express') // http://expressjs.com/
const cookieParser = require('cookie-parser');
const multer = require('multer')
const bodyParser = require("body-parser");
const history = require('connect-history-api-fallback');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const jsonParser = bodyParser.json()

const Setting = require('./Setting')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')
const FileUtil = require('./FileUtil')
const ZipUtil = require('./ZipUtil')
const SseUtil = require('./SseUtil')
const {getPageWebHome} = require("../../common/globalSetting");

let session = new Set()
let systemToken = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex');
session.add(systemToken)

const StatusStart = "start"
const StatusStop = "stop"

let server;
let status = StatusStop;


function authFilter(req, res, next) {
    // console.log('authFilter', req)
    // no auth
    if (!Setting.getAuthEnable()) {
        // console.log('no auth')
        next()
        return;
    }
    // white list
    if (req.url === '/' ||
        req.url === '/index.html' ||
        req.url === '/favicon.ico' ||
        req.url === '/api/login' ||
        req.url === '/api/registrySSE' ||
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
        return {finalPath: '', filePaths: [], startPath: ''}
    }
    // 查询起始分享文件
    let filePaths = filename.split('/').filter(p => !!p && p !== '')
    let startPath = filePaths[0]
    let startFile = FileDb.getFile(startPath);
    if (!startFile) {
        throw new Error("分享列表未找到该文件")
    }
    let filePath = startFile.path;
    // console.log('filePath', filePath)
    // console.log('filePaths', filePaths)
    // 拼接路径
    let dirname = path.dirname(filePath)
    // console.log('prefix', dirname)
    let fullPath = [...filePaths]
    fullPath.unshift(dirname)
    // console.log('fullPath', fullPath)
    let finalPath = fullPath.join(path.sep)
    // console.log('finalPath', finalPath)
    return {finalPath, filePaths, startPath};
}

/**
 * 获取客户端IP
 */
function getClientIp(req) {
    let sourceip = req.ip.match(/\d+\.\d+\.\d+\.\d+/).toString()
    // 获取反向代理记录的真实客户端IP
    let realip = req.headers['x-real-ip']
    let clientip = realip || sourceip
    console.log('sourceip %s, realip %s, clientip %s', sourceip, realip, clientip)
    return clientip;
}

const initApp = () => {
    let app = express();
    app.use(history({
        index: '/index.html',
        rewrites: [
            {
                from: /^\/api\/.*$/,
                to: function(context) {
                    return context.parsedUrl.path
                }
            }
        ]
    }))
    app.use(cookieParser());
    app.all("/api/*", authFilter);
    app.use(express.static(getPageWebHome(), {index: 'index.html'}))
    // file list
    app.get('/api/files', function (req, res) {
        let path = req.query.path
        console.log('/api/files', path)
        let sourceFilePath, filePaths;
        try {
            let parseResult = parsePath(path)
            sourceFilePath = parseResult.finalPath
            filePaths = parseResult.filePaths
            if (sourceFilePath !== '' && !fs.existsSync(sourceFilePath)) {
                console.log("文件在系统不存在", sourceFilePath)
                res.sendStatus(404);
                return;
            }
        } catch (e) {
            res.json({code: 500, message: e.message});
            return;
        }

        if (sourceFilePath.length === 0) {
            res.json({code: 200, data: {path: [], files: FileDb.listFiles()}});
            return;
        }
        return res.json({code: 200, data: {path: filePaths, files: FileUtil.listFiles(sourceFilePath)}});
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
        let timestamp = req.query.timestamp
        console.log('/api/download filename', filename)

        let sourceFilePath;
        try {
            let parseResult = parsePath(filename)
            sourceFilePath = parseResult.finalPath
            if (!sourceFilePath) {
                console.log("请求的文件在数据库不存在", filename)
                res.sendStatus(400);
                return;
            }
            if (!fs.existsSync(sourceFilePath)) {
                console.log("文件在系统不存在", sourceFilePath)
                res.sendStatus(404);
                return;
            }
        } catch (e) {
            console.log(e)
            res.sendStatus(404);
            return;
        }
        console.log('finalPath', sourceFilePath)

        let doDownload = (destZipFile, callback = () => {
        }) => {
            res.download(destZipFile, null, {
                dotfiles: 'allow'
            }, function (err) {
                if (err) {
                    console.log(err);
                }
                callback();
            })
        }

        if (fs.lstatSync(sourceFilePath).isDirectory()) {
            console.log("send directory: " + sourceFilePath);
            let fileName = FileUtil.parseFileName(sourceFilePath);
            let destZipFile = path.join(FileUtil.getTempFilePath(), fileName + "_" + timestamp) + ".zip"
            if (fs.existsSync(destZipFile)) {
                doDownload(destZipFile, () => FileUtil.clearTempFileDelay(destZipFile))
            } else {
                ZipUtil.zipDirectory(sourceFilePath, destZipFile).then((event) => {
                    doDownload(destZipFile, () => FileUtil.clearTempFileDelay(destZipFile))
                }).catch(error => {
                    console.log(error)
                })
            }
        } else {
            console.log("send file: " + sourceFilePath);
            doDownload(sourceFilePath)
        }
    });

    app.post('/api/login', urlencodedParser, jsonParser, function (req, res) {
        console.log("api/login")
        // no auth
        if (!Setting.getAuthEnable()) {
            res.json({code: 200, message: 'success'})
            return;
        }
        // password error
        let password = req.body.password
        console.log("password", password)
        console.log("Setting.getPassword()", Setting.getPassword())
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

    // 注册SSE事件
    app.get('/api/registrySSE', SseUtil.registry);
    EventDispatcher.registryEventListener('fileDb.listChange', () => {
        SseUtil.sendEvent({type: 'fileDb.listChange'}).then(() => {
            console.log("send fileDb.listChange event")
        })
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
    FileUtil.clearTempDir()
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
exports.getSystemToken = () => systemToken
