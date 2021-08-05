const fs = require('fs')
const path = require('path')
const express = require('express') // http://expressjs.com/

let shareFileRoot;
let server;

const initFileShareRouter = (app, rootPath) => {
  app.get('/file/:name', function (req, res) {
    let fileName = req.params.name
    let absFilename = path.join(rootPath, fileName);
    res.download(absFilename, path.basename(absFilename), () => {
      console.log("send file: " + absFilename)
    })
  });
}

const initApp = (rootPath) => {
  let app = express();
  initFileShareRouter(app, rootPath);
  return app;
}

// 开启文件服务
const startServer = (port = 8080) => {
  if (!shareFileRoot) {
    return {success: false, message: "没有设置共享文件"};
  }

  const app = initApp(shareFileRoot)
  server = app.listen(port, () => {
    console.log("start on *:" + port)
  });
  return {success: true, message: "启动成功"};
}

// 关闭文件服务
const stopServer = () => {
  server.close();
}

// 查看指定路径下的文件信息
const listFiles = (file) => {
  let absDir = shareFileRoot + file;
  let result = []
  let filenames = fs.readdirSync(absDir);
  for (let filename of filenames) {
    let absolutePath = path.join(absDir, filename);
    let data = fs.statSync(absolutePath);
    result.push({filename: filename, isFile: data.isFile()})
  }
  return result;
}

// 设置共享文件或目录
const setShareFilePath = (filePath) => {
  shareFileRoot = filePath;
}

setShareFilePath("/Users/chenkeyu/Desktop/0801报销/")
let result = listFiles("");
console.log(result)
startServer();
stopServer();

window.api = {
  startServer,
  stopServer,
  listFiles,
  setShareFilePath
}