/**
 * github: https://github.com/tus/tus-node-server.git
 * 支持超大文件分片上传、断点续传
 */
const tus = require("tus-node-server")
const express = require("express")
const Setting = require("./Setting")

class MemoryConfigstore {
  constructor() {
    this.data = new Map()
  }

  async get(key) {
    let value = this.data.get(key)
    if (value !== undefined) {
      value = JSON.parse(value)
    }
    return value
  }

  async set(key, value) {
    this.data.set(key, JSON.stringify(value))
  }

  async delete(key) {
    return this.data.delete(key)
  }
}

function createStore() {
  const uploadPath = Setting.getUploadPath()
  const configstore = new MemoryConfigstore()
  const datastore = new tus.FileStore({
    directory: uploadPath,
    configstore: configstore,
  })
  return { configstore, datastore }
}

function createTusApp() {
  let uploadPath = Setting.getUploadPath()

  const server = new tus.Server({ path: "/" })
  const store = createStore()
  server.datastore = store.datastore

  const app = express()
  app.all("*", (req, res, next) => {
    const newPath = Setting.getUploadPath()
    if (newPath !== uploadPath) {
      const _store = createStore()
      store.datastore = _store.datastore
      store.configstore = _store.configstore
      server.datastore = _store.datastore
    }
    server.handle(req, res, next)
  })

  return { app, server, store }
}

exports.createTusApp = createTusApp
