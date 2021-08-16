const path = require('path')
const express = require('express') // http://expressjs.com/
const IpUtil = require('./utils/IpUtil')

let fileDb = new Map();
let server;

const initApp = () => {
  let app = express();
  app.use(express.static(path.join(__dirname, 'web')))
  app.use(express.static(path.join(__dirname, 'app')))
  // 文件下载页面
  app.get('/files', function (req, res) {
    let files = Array.from(fileDb.values());
    res.json({files: files});
  });
  // 文件下载链接
  app.get('/download/:name', function (req, res) {
    let filename = req.params.name
    let filePath = fileDb.get(filename).path;
    console.log("send file: " + filePath);
    res.download(filePath)
  });
  return app;
}

// 开启服务
const startServer = (port = 5421) => {
  const app = initApp()
  let url = `http://${IpUtil.getIpAddress()}:${port}/download.html`;
  server = app.listen(port, () => {
    console.log("start success! download url: " + url)
  });
  return {success: true, message: "启动成功", url: url};
}

// 关闭服务
const stopServer = () => {
  server.close();
}

const addFile = (file) => {
  console.log("addFile: " + file);
  fileDb.set(file.name, file)
}

const removeFile = (file) => {
  console.log("removeFile: " + file);
  fileDb.delete(file.name)
}

const listFiles = () => {
  return fileDb.values();
}

window.api = {
  startServer,
  stopServer,
  addFile,
  removeFile,
  listFiles
}

// for local test: node src/index.js
// startServer();
// addFile({name: "test1.txt", path: "/Users/chenkeyu/Desktop/test1.txt"})
// addFile({name: "test2.txt", path: "/Users/chenkeyu/Desktop/test2.txt"})
// addFile({name: "test3.txt", path: "/Users/chenkeyu/Desktop/test3.txt"})