<template>
  <div class="body">
    <div class="container">
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
              <el-button v-if="netInterfaceNames.length>1" type="default" size="mini" icon="el-icon-sort" title="切换网卡"
                         @click="changeNetInterface()"></el-button>
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
        <div class="btn-box">
          <div class="start-btn" @click="startServer">开启服务</div>
          <div class="start-btn-shadow">
            <span style="--i:1"></span>
            <span style="--i:2"></span>
            <span style="--i:3"></span>
            <span style="--i:4"></span>
            <span style="--i:5"></span>
            <span style="--i:6"></span>
            <span style="--i:7"></span>
            <span style="--i:8"></span>
            <span style="--i:9"></span>
            <span style="--i:10"></span>
          </div>
        </div>
      </div>
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
      files: [],
      netInterfaceNames: [],
      currentNetInterfaceIdx: 0,
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
    },
    changeNetInterface: function () {
      this.currentNetInterfaceIdx = this.currentNetInterfaceIdx + 1;
      let name = this.netInterfaceNames[this.currentNetInterfaceIdx % this.netInterfaceNames.length];
      let ip = api.getIpAddress(this.currentNetInterfaceIdx);
      this.url = api.genUrl(ip);
      ElMessage.success({message: `切换网卡为 "${name}"`, type: 'success'});
    }
  },
  mounted: function () {
    this.netInterfaceNames = api.getNetInterfaceNames();
  },
  components: {}
}
</script>

<style>
body {
  margin: 0;
}

.body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  background-blend-mode: screen, overlay, hard-light, color-burn, color-dodge, normal;
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-position: 0 100%;
  min-height: 600px;
}

.container {
  max-width: 500px;
  margin: 0 auto;
  padding-top: 18px;
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

.btn-box {
  width: 150px;
  height: 150px;
}

.start-btn {
  text-align: center;
  line-height: 100px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  z-index: 99;
  position: absolute;
  top: 150px;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
  background-color: #409eff;
  color: #ffffff;
}

.start-btn:hover {
  cursor: pointer;
  background-color: #66b1ff;
}

.start-btn-shadow {
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 150px;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
  z-index: 1;
}

.start-btn-shadow span {
  z-index: 1;
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #ffffff;
  border-radius: 50%;
  animation: animate 2s linear infinite;
  animation-delay: calc(0.5s * var(--i))
}

.start-btn-shadow:nth-child(2) span {
  border: none;
  background-color: #f5f5f5;
  opacity: 0.8;
}

@keyframes animate {
  0% {
    width: 50px;
    height: 50px;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}
</style>
