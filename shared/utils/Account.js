// ----- 账号管理 -----
const crypto = require('crypto')
const AppDatabase = require('./Database')

const AccountKey = 'accounts'

// 默认权限：全部允许
function defaultPermissions() {
    return {
        download: true,
        uploadFile: true,
        uploadText: true,
        allowAccess: '',
        denyAccess: '',
    }
}

function normalizePermissions(permissions = {}) {
    const base = defaultPermissions()
    if (!permissions || typeof permissions !== 'object') {
        return base
    }
    return {
        download: permissions.download == null ? base.download : !!permissions.download,
        uploadFile: permissions.uploadFile == null ? base.uploadFile : !!permissions.uploadFile,
        uploadText: permissions.uploadText == null ? base.uploadText : !!permissions.uploadText,
        allowAccess: typeof permissions.allowAccess === 'string' ? permissions.allowAccess : '',
        denyAccess: typeof permissions.denyAccess === 'string' ? permissions.denyAccess : '',
    }
}

function getAccounts() {
    let accountsStr = AppDatabase.getStorageItem(AccountKey, '[]')
    try {
        let accounts = JSON.parse(accountsStr)
        return Array.isArray(accounts) ? accounts : []
    } catch (e) {
        console.log('解析账号数据失败', e)
        return []
    }
}

function saveAccounts(accounts) {
    AppDatabase.setStorageItem(AccountKey, JSON.stringify(accounts))
}

function normalizeAccount(account) {
    return {...account, permissions: normalizePermissions(account.permissions)}
}

function listAccounts() {
    return getAccounts().map(normalizeAccount)
}

function getAccountByUsername(username) {
    if (!username) {
        return null
    }
    let account = getAccounts().find(a => a.username === username)
    return account ? normalizeAccount(account) : null
}

function getAccountById(id) {
    let account = getAccounts().find(a => a.id === id)
    return account ? normalizeAccount(account) : null
}

/**
 * 添加账号
 * @param {{username:string, password:string, permissions:object}} account
 * @returns {Promise<{success:boolean, message:string, data?:object}>}
 */
function addAccount(account = {}) {
    return new Promise((resolve, reject) => {
        let username = (account.username || '').trim()
        let password = account.password || ''
        if (!username) {
            return reject({success: false, message: '用户名不能为空'})
        }
        if (!password) {
            return reject({success: false, message: '密码不能为空'})
        }
        let accounts = getAccounts()
        if (accounts.some(a => a.username === username)) {
            return reject({success: false, message: '用户名已存在'})
        }
        let newAccount = {
            id: crypto.randomBytes(8).toString('hex'),
            username,
            password,
            permissions: normalizePermissions(account.permissions),
        }
        accounts.push(newAccount)
        saveAccounts(accounts)
        resolve({success: true, message: '添加成功', data: newAccount})
    })
}

/**
 * 修改账号信息（用户名 / 密码 / 权限）
 * @param {string} id
 * @param {{username?:string, password?:string, permissions?:object}} account
 */
function updateAccount(id, account = {}) {
    return new Promise((resolve, reject) => {
        let accounts = getAccounts()
        let idx = accounts.findIndex(a => a.id === id)
        if (idx === -1) {
            return reject({success: false, message: '账号不存在'})
        }
        let username = (account.username || accounts[idx].username).trim()
        if (!username) {
            return reject({success: false, message: '用户名不能为空'})
        }
        if (accounts.some((a, i) => i !== idx && a.username === username)) {
            return reject({success: false, message: '用户名已存在'})
        }
        accounts[idx] = {
            ...accounts[idx],
            username,
            password: account.password ? account.password : accounts[idx].password,
            permissions: account.permissions ? normalizePermissions(account.permissions) : accounts[idx].permissions,
        }
        saveAccounts(accounts)
        resolve({success: true, message: '修改成功', data: accounts[idx]})
    })
}

/**
 * 修改账号密码
 * @param {string} id
 * @param {string} password
 */
function updateAccountPassword(id, password) {
    return new Promise((resolve, reject) => {
        if (!password) {
            return reject({success: false, message: '密码不能为空'})
        }
        let accounts = getAccounts()
        let idx = accounts.findIndex(a => a.id === id)
        if (idx === -1) {
            return reject({success: false, message: '账号不存在'})
        }
        accounts[idx].password = password
        saveAccounts(accounts)
        resolve({success: true, message: '修改成功'})
    })
}

/**
 * 删除账号
 * @param {string} id
 */
function removeAccount(id) {
    return new Promise((resolve, reject) => {
        let accounts = getAccounts()
        let next = accounts.filter(a => a.id !== id)
        if (next.length === accounts.length) {
            return reject({success: false, message: '账号不存在'})
        }
        saveAccounts(next)
        resolve({success: true, message: '删除成功'})
    })
}

// ----- 路径访问权限 -----

// 将通配符规则编译为正则，作为路径前缀匹配
function compileRule(pattern) {
    // 统一分隔符，去除首尾空白及末尾路径分隔符
    let normalized = (pattern || '').replace(/\\/g, '/').trim().replace(/\/+$/, '')
    if (!normalized) {
        return null
    }
    let escaped = normalized
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
    return new RegExp('^' + escaped, 'i')
}

// 拆分规则，支持英文逗号、中文逗号及换行分隔
function splitRules(rulesStr) {
    return (rulesStr || '')
        .split(/[,\n，]/)
        .map(r => r.trim())
        .filter(Boolean)
}

/**
 * 判断路径是否命中规则（多条规则以 , 或换行分隔，支持通配符 *）
 * @param {string} filePath
 * @param {string} rulesStr
 */
function matchRules(filePath, rulesStr) {
    if (!rulesStr) {
        return false
    }
    let normalizedPath = (filePath || '').replace(/\\/g, '/')
    return splitRules(rulesStr).some(rule => {
        let regex = compileRule(rule)
        return regex ? regex.test(normalizedPath) : false
    })
}

/**
 * 根据权限判断路径是否可访问
 * 禁止访问优先；配置了允许访问时必须在允许范围内；未配置则默认允许
 * @param {string} filePath
 * @param {object} permissions
 */
function canAccessPath(filePath, permissions) {
    let perms = normalizePermissions(permissions)
    if (perms.denyAccess && matchRules(filePath, perms.denyAccess)) {
        return false
    }
    if (perms.allowAccess && !matchRules(filePath, perms.allowAccess)) {
        return false
    }
    return true
}

exports.AccountKey = AccountKey
exports.defaultPermissions = defaultPermissions
exports.normalizePermissions = normalizePermissions
exports.listAccounts = listAccounts
exports.getAccountByUsername = getAccountByUsername
exports.getAccountById = getAccountById
exports.addAccount = addAccount
exports.updateAccount = updateAccount
exports.updateAccountPassword = updateAccountPassword
exports.removeAccount = removeAccount
exports.matchRules = matchRules
exports.canAccessPath = canAccessPath
