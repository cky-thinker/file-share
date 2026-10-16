// ----- Leveldb 存储适配器（Docker 服务专用） -----
const fs = require('fs')

/**
 * LevelDB 为异步 API，而 Database 接口为同步设计；
 * 启动时先全量加载到内存缓存，运行期读取内存、写入穿透到 leveldb 持久化。
 */
class LevelDbAdapter {
    constructor(dbPath) {
        this.dbPath = dbPath
        this.cache = new Map()
        this.db = null
    }

    async init() {
        const level = require('level')
        fs.mkdirSync(this.dbPath, {recursive: true})
        this.db = level(this.dbPath, {valueEncoding: 'json'})
        await this.db.open()
        return new Promise((resolve, reject) => {
            this.db.createReadStream()
                .on('data', ({key, value}) => this.cache.set(key, value))
                .on('error', reject)
                .on('end', resolve)
        })
    }

    getStorageItem(key, defaultValue = null) {
        if (this.cache.has(key)) {
            return this.cache.get(key)
        }
        if (defaultValue === undefined || defaultValue === null) {
            return null
        }
        let value = typeof defaultValue === 'function' ? defaultValue() : defaultValue
        this.setStorageItem(key, value)
        return value
    }

    setStorageItem(key, value) {
        this.cache.set(key, value)
        this.db.put(key, value).catch(e => {
            console.log('leveldb put fail', key, e)
        })
    }

    async close() {
        if (this.db) {
            await this.db.close()
            this.db = null
        }
    }
}

module.exports = LevelDbAdapter
