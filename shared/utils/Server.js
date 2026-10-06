const path = require('path')
const fs = require('fs')
const crypto = require('crypto');
const express = require('express')
const cookieParser = require('cookie-parser');
const multer = require('multer')
const bodyParser = require("body-parser");
const history = require('connect-history-api-fallback');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json()

const Setting = require('./Setting')
const Account = require('./Account')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')
const FileUtil = require('./FileUtil')
const ZipUtil = require('./ZipUtil')
const SseUtil = require('./SseUtil')

// ----- JWT -----
// 签名密钥在服务进程内随机生成，服务重启后旧 token 自动失效
const JWT_SECRET = crypto.randomBytes(32)

function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function hmacSign(data) {
    return crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * 生成 JWT（HS256）
 * @param {object} payload 载荷
 * @param {number} expiresInSec 有效期（秒），<=0 表示永久有效
 */
function signJwt(payload, expiresInSec = 0) {
    let now = Math.floor(Date.now() / 1000)
    let body = {...payload, iat: now}
    if (expiresInSec > 0) {
        body.exp = now + expiresInSec
    }
    let data = `${base64UrlEncode(JSON.stringify({alg: 'HS256', typ: 'JWT'}))}.${base64UrlEncode(JSON.stringify(body))}`
    return `${data}.${hmacSign(data)}`
}

/**
 * 校验 JWT
 * @param {string} token
 * @returns {object|null} 校验通过返回载荷，否则返回 null
 */
function verifyJwt(token) {
    if (!token || typeof token !== 'string') {
        return null
    }
    let parts = token.split('.')
    if (parts.length !== 3) {
        return null
    }
    let data = `${parts[0]}.${parts[1]}`
    let expected = hmacSign(data)
    if (parts[2].length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) {
        return null
    }
    let payload
    try {
        payload = JSON.parse(base64UrlDecode(parts[1]))
    } catch (e) {
        return null
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null
    }
    return payload
}

// 管理员（未开启认证）权限：全部允许
function adminPermissions() {
    return {admin: true, ...Account.defaultPermissions()}
}

/**
 * 生成管理员 token（供本地应用拼装分享/下载链接）
 * @param {boolean} permanent 是否永久有效
 * @param {number} timeoutSec 非永久时的有效期（秒）
 */
function getToken(permanent = true, timeoutSec = 3600) {
    return signJwt({permissions: adminPermissions()}, permanent ? 0 : timeoutSec)
}

/**
 * 解析 token 载荷对应的最新权限：
 * 账号 token 以账号当前权限为准（保证修改权限/访问规则后立即生效），
 * 管理员 token 使用 token 内权限。
 * @param {object|null} payload
 * @returns {object|null} 权限对象；账号不存在时返回 null
 */
function resolvePermissions(payload) {
    if (!payload) {
        return null
    }
    if (payload.username) {
        let account = Account.getAccountByUsername(payload.username)
        return account ? account.permissions : null
    }
    return payload.permissions || null
}

const StatusStart = "start"
const StatusStop = "stop"

let server;
let status = StatusStop;


function authFilter(req, res, next) {
    // console.log('authFilter', req)
    // no auth
    if (!Setting.getAuthEnable()) {
        // console.log('no auth')
        req.permissions = adminPermissions()
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
    let token = req.get('Authorization')
    let permissions = resolvePermissions(verifyJwt(token))
    if (permissions) {
        req.permissions = permissions
        next()
    } else {
        res.json({ code: 401, message: '认证失败' })
        res.end();
    }
}

/**
 * 根据文件路径，查询起始的分享文件，并且拼接该文件的路径
 */
function parsePath(filename) {
    if (!filename) {
        return { finalPath: '', filePaths: [], startPath: '' }
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
    return { finalPath, filePaths, startPath };
}

/**
 * 获取客户端IP
 */
function getClientIp(req) {
    let sourceip = `${req.ip.match(/\d+\.\d+\.\d+\.\d+/) || req.ip}`
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
                to: function (context) {
                    return context.parsedUrl.path
                }
            }
        ]
    }))
    app.use(cookieParser());
    app.all("/api/*", authFilter);
    let rootPath = path.resolve(__dirname, '..')
    console.log("rootPath", rootPath)
    app.use(express.static(path.join(rootPath, 'page_web'), { index: 'index.html' }))
    // file list
    app.get('/api/files', function (req, res) {
        let path = req.query.path
        console.log('/api/files', path)
        let permissions = req.permissions || adminPermissions()
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
            if (sourceFilePath !== '' && !Account.canAccessPath(sourceFilePath, permissions)) {
                console.log("无权访问该路径", sourceFilePath)
                res.sendStatus(403);
                return;
            }
        } catch (e) {
            res.json({ code: 500, message: e.message });
            return;
        }

        let filterByPermission = (files) => files.filter(f => Account.canAccessPath(f.path, permissions))

        if (sourceFilePath.length === 0) {
            res.json({ code: 200, data: { path: [], files: filterByPermission(FileDb.listFiles()) } });
            return;
        }
        return res.json({ code: 200, data: { path: filePaths, files: filterByPermission(FileUtil.listFiles(sourceFilePath)) } });
    });
    // download
    app.get('/api/download', function (req, res) {
        let token = req.query.token
        console.log('/api/download token', token)
        let permissions
        if (Setting.getAuthEnable()) {
            permissions = resolvePermissions(verifyJwt(token))
            if (!permissions || !permissions.download) {
                res.sendStatus(403)
                return;
            }
        } else {
            permissions = adminPermissions()
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
            if (!Account.canAccessPath(sourceFilePath, permissions)) {
                console.log("无权下载该文件", sourceFilePath)
                res.sendStatus(403);
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

    app.get("/api/getSetting", (req, res) => {
        let { authEnable } = Setting.getSetting()
        res.json({ code: 200, data: { authEnable, permissions: req.permissions || adminPermissions() }, message: 'success' })
    })

    // JWT 为无状态 token，登出由客户端清除本地凭证即可
    app.get("/api/logout", (req, res) => {
        res.json({ code: 200, message: 'success' })
    })

    app.post('/api/login', urlencodedParser, jsonParser, function (req, res) {
        console.log("api/login")
        // no auth
        if (!Setting.getAuthEnable()) {
            let permissions = adminPermissions()
            let token = signJwt({permissions})
            res.json({ code: 200, data: { Authorization: token, permissions }, message: 'success' })
            return;
        }
        let username = (req.body.username || '').trim()
        let password = req.body.password
        console.log("username", username)
        if (!username) {
            res.json({ code: 403, message: '请输入用户名' })
            return;
        }
        // 账号登录
        let account = Account.getAccountByUsername(username)
        if (!account || account.password !== password) {
            res.json({ code: 403, message: '用户名或密码错误' })
            return;
        }
        let permissions = account.permissions
        let token = signJwt({username: account.username, permissions})
        res.json({ code: 200, data: { Authorization: token, permissions }, message: 'success' })
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

    let upload = multer({ storage: storage });
    app.post('/api/addFile', upload.single('file'), function (req, res, next) {
        let permissions = req.permissions || adminPermissions()
        if (!permissions.uploadFile) {
            res.json({ code: 403, message: '无上传文件权限' })
            return;
        }
        let file = req.file;
        let sourceip = getClientIp(req)
        FileDb.addFile({ name: file.originalname, path: file.path, username: sourceip })
        res.json({ code: 200, message: '添加成功' })
    })

    app.post('/api/addText', jsonParser, function (req, res, next) {
        console.log(req)
        let permissions = req.permissions || adminPermissions()
        if (!permissions.uploadText) {
            res.json({ code: 403, message: '无上传文本权限' })
            return;
        }
        let sourceip = getClientIp(req)
        let text = req.body.message
        if (!text) {
            res.json({ code: 500, message: '消息不能为空' })
            return;
        }
        FileDb.addText(text, sourceip)
        res.json({ code: 200, message: '添加成功' })
    })

    // 注册SSE事件
    app.get('/api/registrySSE', SseUtil.registry);
    EventDispatcher.registryEventListener('fileDb.listChange', () => {
        SseUtil.sendEvent({ type: 'fileDb.listChange' }).then(() => {
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
        EventDispatcher.triggerEvent({ type: 'server.statusChange', data: { status: StatusStart } })
    });
    FileUtil.clearTempDir()
    return { success: true, message: "服务启动成功", url: Setting.getUrl() };
}

const stopServer = () => {
    server.close();
    status = StatusStop;
    EventDispatcher.triggerEvent({ type: 'server.statusChange', data: { status: StatusStop } })
}

const getServerStatus = () => {
    return status;
}

exports.startServer = startServer
exports.stopServer = stopServer
exports.getServerStatus = getServerStatus
exports.StatusStart = StatusStart
exports.StatusStop = StatusStop
exports.getToken = getToken