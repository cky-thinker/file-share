<template>
  <div class="body">
    <div v-if="serverRunning">
      <el-space size="large" direction="vertical">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <el-row class="row-bg" justify="space-between">
                <el-col :span="6">正在分享...</el-col>
                <el-col :span="6">
                  <el-button type="danger" size="small" @click="stopServer" plain>取消分享</el-button>
                </el-col>
              </el-row>
            </div>
          </template>
          <el-row class="row-bg" justify="space-between">
            分享链接：{{ url }}
            <el-button type="default" size="mini" icon="el-icon-document-copy" title="复制链接到剪切板"
                       @click="handleClipboard($event)"></el-button>
          </el-row>
        </el-card>

        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <el-row class="row-bg" justify="space-between">
                <el-col :span="6">分享列表</el-col>
                <el-col :span="6">
                  <el-upload action="" :show-file-list="false" multiple :http-request="addFiles">
                    <el-button type="primary" size="small" plain>添加文件</el-button>
                  </el-upload>
                </el-col>
              </el-row>
            </div>
          </template>

          <div v-for="file in files" :key="file" class="text item file-item">
            <el-row class="row-bg" justify="space-between">
              <el-col :span="20">{{ file.name }}</el-col>
              <el-col :span="4">
                <el-button type="default" icon="el-icon-delete"
                           @click="() => removeFile(file)"></el-button>
              </el-col>
            </el-row>
          </div>

          <el-alert v-if="files.length === 0" title="无" :closable="false" type="info" center>
          </el-alert>
        </el-card>
      </el-space>
    </div>
    <div v-else>
      <el-button type="primary" size="small" @click="startServer">开始分享</el-button>
    </div>
  </div>
</template>

<script>
import Clipboard from 'clipboard'
import {ElMessage} from 'element-plus'

let api = window.api;

let copyClipboard = (text, event) => {
  const clipboard = new Clipboard(event.target, {
    text: () => text
  })
  clipboard.on('success', () => {
    ElMessage.success({message: '复制成功', type: 'success'});
  })
  clipboard.onClick(event)
}

export default {
  name: 'App',
  data: () => {
    return {
      serverRunning: false,
      url: "",
      qrcode: "",
      files: []
    }
  },
  methods: {
    startServer: function () {
      let {url} = api.startServer();
      this.url = url
      this.serverRunning = true;
    },
    stopServer: function () {
      api.stopServer()
      this.serverRunning = false;
    },
    addFiles: function (params) {
      let file = {name: params.file.name, path: params.file.path};
      this.files.push(file);
      api.addFile(file)
    },
    removeFile: function (file) {
      let removeFiles = this.files.filter((f) => f.name === file.name);
      console.log(removeFiles)
      this.files = this.files.filter((f) => f.name !== file.name);
      api.removeFile(removeFiles[0])
    },
    handleClipboard: function (event) {
      copyClipboard(this.url, event)
    }
  },
  components: {}
}
</script>

<style>
.body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  max-width: 500px;
  margin: 0 auto;
}

.file-item {
  margin-bottom: 10px;
}

.qrcode {
  max-width: 300px;
  max-height: 300px;
  text-align: left;
}

.box-card {
  width: 500px;
}

.row-bg {
  align-items: center;
}
</style>
