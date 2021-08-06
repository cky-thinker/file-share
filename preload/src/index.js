const path = require('path')
const express = require('express') // http://expressjs.com/
const template = require('art-template');

let fileDb = new Map();
let server;

const initApp = () => {
  let app = express();
  // 文件下载页面
  app.get('/', function (req, res) {
    let files = Array.from(fileDb.values());
    let html = template(__dirname + "/views/index.art.html", {files: files})
    res.send(html);
  });
  // 文件下载链接
  app.get('/download/:name', function (req, res) {
    let filename = req.params.name
    let filePath = fileDb.get(filename).path;
    res.download(filePath, path.basename(filePath), () => {
      console.log("send file: " + filePath)
    })
  });
  return app;
}

// 开启服务
const startServer = (port = 8080) => {
  const app = initApp()
  server = app.listen(port, () => {
    console.log("start on http://localhost:" + port)
  });
  return {success: true, message: "启动成功"};
}

// 关闭服务
const stopServer = () => {
  server.close();
}

const addFile = (file) => {
  fileDb.set(file.name, file)
}

const removeFile = (file) => {
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