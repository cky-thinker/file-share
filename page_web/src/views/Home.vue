<template>
  <div>
    <div class="body">
      <div class="header">
        <div class="overlay">
          <h1>File Share</h1>
          <h3>跨平台、高速的文件传输工具</h3>
        </div>
      </div>

      <el-card class="file-list">
        <template #header>
          <div class="clearfix">
            <el-row class="row-bg">
              <el-col :span="12">
                <span style="margin-right: 20px">分享列表</span>
                <el-button v-if="batchDownload" @click="batchDownloadHandler">
                  <svg-icon name="批量下载"/>
                  {{ isPC ? "批量下载" : "" }}
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button @click="fileFormVisible= true">
                  <svg-icon name="发送文件"/>
                  {{ isPC ? "上传文件" : "" }}
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button @click="showMsgForm" type="default" title="分享一段文本">
                  <svg-icon name="发送消息"/>
                  {{ isPC ? "上传文本" : "" }}
                </el-button>
              </el-col>
            </el-row>
          </div>
        </template>

        <div style="padding-left: 16px; padding-right: 16px; margin-bottom: 8px;">
          <el-checkbox class="select-all-btn" @change="selectAll"></el-checkbox>
          <el-breadcrumb class="header-breadcrumb" separator="/">
            <el-breadcrumb-item>
              <el-link :underline="false" @click="skipPath(0)">
                首页
              </el-link>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-bind:key="idx" v-for="(p, idx) in path">
              <el-link :underline="false" @click="skipPath(idx + 1)">
                {{ p }}
              </el-link>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div style="padding-left: 16px; padding-right: 16px">
          <el-table
            :max-height="listHeight"
            :show-header="false"
            :data="files"
            row-key="id"
          >
            <el-table-column width="30px" align="center">
              <template #default="scope">
                <el-checkbox v-if="['directory', 'file'].includes(scope.row.type)"
                             @change="onSelectHandler(scope.row.name)"
                             v-model="scope.row.selected"></el-checkbox>
              </template>
            </el-table-column>
            <el-table-column>
              <template #default="scope">
                <div :class="`${scope.row.type === 'directory' ? 'pointer' : ''} file-desc`"
                     @click="openDirectory(scope.row, $event)">
                  <!-- 非图片文件 -->
                  <file-icon v-if="scope.row.type === 'file' && !isPicture(scope.row.name)" :filename="scope.row.name"/>
                  <!-- 图片文件 -->
                  <el-image
                    v-if="scope.row.type === 'file' && isPicture(scope.row.name)"
                    class="file-image"
                    fit="scale-down"
                    :src="scope.row.fullUrl"
                    :preview-src-list="[scope.row.fullUrl]">
                  </el-image>
                  <!-- 文件夹 -->
                  <file-icon v-if="scope.row.type === 'directory'" :is-directory="true"/>
                  <!-- 消息 -->
                  <svg-icon v-if="scope.row.type === 'text'" name="message" icon-style="width: 2em; height: 2em;"/>
                  <el-tooltip effect="light"
                              :content="scope.row.type === 'text' ? scope.row.content : scope.row.name"
                              placement="top">
                    <div class="filename">{{ scope.row.name }}</div>
                  </el-tooltip>
                  <el-tooltip v-if="!!scope.row.username" effect="light"
                              :content="`由【${scope.row.username}】分享`"
                              placement="top">
                    <el-icon class="username" size="16">
                      <User/>
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="70">
              <template #default="scope">
                <el-button v-if="['file', 'directory'].includes(scope.row.type)"
                           @click="handleDownload(scope.row, $event)" plain>
                  <el-icon size="16">
                    <Download/>
                  </el-icon>
                </el-button>

                <el-button v-if="scope.row.type === 'text'" @click="handleDownload(scope.row, $event)" plain>
                  <el-icon size="16">
                    <DocumentCopy/>
                  </el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
      <el-dialog
        title="分享文件"
        name="file"
        class="dialog"
        v-model="fileFormVisible">
        <div style="display: flex; justify-content: center">
          <el-upload
            drag
            action="/api/addFile"
            :on-success="uploadSuccess"
            :on-error="uploadError"
            :file-list="fileList"
            :headers="headers"
            :before-upload="loadTusConfig"
            multiple>
            <el-icon size="20">
              <UploadFilled/>
            </el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </div>
      </el-dialog>
      <el-dialog
        title="分享文本"
        class="dialog"
        v-model="msgFormVisible">
        <el-form ref="form" :model="msgForm" label-width="80px">
          <el-form-item label="文本内容">
            <el-input type="textarea" :rows="5" v-model="msgForm.message"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitMsgForm">提 交</el-button>
          <el-button @click="msgFormVisible = false">取 消</el-button>
        </span>
        </template>
      </el-dialog>
      <el-dialog
        title="身份校验"
        class="dialog"
        v-model="loginFormVisible">
        <el-form ref="loginForm" :model="loginForm" label-width="80px">
          <el-form-item label="密码">
            <el-input v-model="loginForm.password"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitLoginForm">提 交</el-button>
        </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import FileIcon from "@/components/FileIcon";
import SvgIcon from "@/components/SvgIcon";
import {getTusConfig, listFiles, uploadMsg} from "@/api/FileApi";
import {login} from "@/api/UserApi";
import {addAuthInvalidCallback, getToken, setToken} from "@/utils/auth";
import {ElMessage, ElMessageBox} from "element-plus";
import {copyClipboard} from '@/utils/clipboard'
import {isPicture} from "@/utils/fileUtil";
import {DocumentCopy, Download, UploadFilled, User} from '@element-plus/icons-vue'

export default {
  name: 'HomeView',
  components: {
    FileIcon, SvgIcon, DocumentCopy, Download, UploadFilled, User
  },
  data() {
    return {
      title: 'File Share',
      selectedFileNames: new Set(),
      batchDownload: false,
      // 文件表单
      fileFormVisible: false,
      fileForm: {},
      fileList: [],
      // 消息表单
      msgFormVisible: false,
      msgForm: {
        message: ''
      },
      // 登录表单
      loginFormVisible: false,
      loginForm: {
        password: ''
      },
      // 共享文件列表
      path: [],
      files: [],
      headers: {
        Authorization: ''
      },
      tusConfig: {},
    }
  },
  async created() {
    this.refreshPath();
    await this.showFiles();
    this.updateRouter();
    // 3s更新一下列表
    addAuthInvalidCallback(() => {
      this.loginFormVisible = true;
    })
    // 更新请求头内容
    this.updateHeaders()
    this.registrySSE();
  },
  watch: {
    $route: function () {
      console.log('-----router change-----')
      this.refreshPath();
      this.showFiles();
    }
  },
  methods: {
    isPicture(filename) {
      return isPicture(filename)
    },
    updateRouter() {
      // 更新路由
      let path = '/' + this.path.join('/')
      console.log("this.path", path)
      this.$router.push(path)
    },
    registrySSE() {
      if (EventSource) {
        let sse = new EventSource("/api/registrySSE")
        sse.onmessage = (event) => {
          console.log("update file list", event)
          if (JSON.parse(event.data).type === 'fileDb.listChange') {
            this.showFiles()
          }
        };
      } else {
        setInterval(this.showFiles, 3000)
      }
    },
    refreshPath() {
      let pathUrl = window.location.pathname;
      if (pathUrl) {
        this.path = pathUrl.split("/").filter(word => word !== "").map(word => decodeURI(word));
      }
    },
    batchDownloadHandler() {
      this.selectedFileNames.forEach(filename => {
        this.downloadFile(filename)
      })
    },
    selectAll(value) {
      this.selectedFileNames = new Set();
      if (value) {
        this.files.forEach(file => {
          if (['directory', 'file'].includes(file.type)) {
            this.selectedFileNames.add(file.name);
          }
        })
      }
      this.batchDownload = this.selectedFileNames.size > 0;
      this.files = this.addAddiFileAttrs(this.files)
    },
    onSelectHandler(filename) {
      if (this.selectedFileNames.has(filename)) {
        this.selectedFileNames.delete(filename)
      } else {
        this.selectedFileNames.add(filename)
      }
      this.batchDownload = this.selectedFileNames.size > 0;
      this.files = this.addAddiFileAttrs(this.files)
    },
    handleDownload(item, event) {
      if (['directory', 'file'].includes(item.type)) {
        if ('directory' === item.type) {
          ElMessageBox.confirm('下载文件夹时, 如果文件夹过大，可能会造成压缩超时或硬盘空间不足，是否继续?', '注意', {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.downloadFile(item.name)
          });
        } else {
          this.downloadFile(item.name)
        }
      } else if (item.type === 'text') {
        this.copyMsg(item.content, event)
      }
    },
    openDirectory(item) {
      if (item.type !== 'directory') {
        return;
      }
      let name = item.name;
      this.selectedFileNames = new Set(); // 切换路径后,已选择文件清空
      this.path.push(name)
      this.updateRouter();
    },
    skipPath(idx) {
      this.path = this.path.slice(0, idx);
      this.updateRouter();
    },
    addAddiFileAttrs(files) {
      return files.map(file => {
        return {...file, selected: this.selectedFileNames.has(file.name), fullUrl: this.getDownloadFileUrl(file.name)}
      })
    },
    async showFiles() {
      try {
        let res = await listFiles({path: this.path.join('/')})
        this.files = this.addAddiFileAttrs(res.data.files)
        this.path = res.data.path
      } catch (error) {
        // 失败回退
        if (this.path.length > 0) {
          this.path.pop()
          this.path = [...this.path]
          this.updateRouter();
        }
        console.log("请求失败", error)
      }
    },
    updateHeaders() {
      this.headers = {Authorization: getToken()}
    },
    submitLoginForm() {
      console.log("---submitLoginForm--")
      login(this.loginForm).then(res => {
        ElMessage({message: '登录成功', type: 'success'})
        setToken(res.data.Authorization)
        this.loginFormVisible = false
        // 更新请求头内容
        this.updateHeaders()
        // 更新列表
        this.showFiles()
      })
    },
    uploadSuccess(response, file, fileList) {
      console.log('---uploadSuccess---', response, file, fileList)
      ElMessage({message: '上传成功', type: 'success'})
      this.fileList = fileList.filter((f) => {
        return f.name !== file.name;
      })
    },
    uploadError(err, file, fileList) {
      console.log('---uploadError---', err, file, fileList)
      ElMessage({message: '上传失败', type: 'success'})
      this.fileList = fileList.filter((f) => {
        return f.name !== file.name;
      })
    },
    async loadTusConfig() {
      const res = await getTusConfig()
      this.tusConfig = res.data
    },
    downloadFile(filename) {
      let a = document.createElement('a');
      a.href = this.getDownloadFileUrl(filename);
      a.download = name;
      a.click()
      a.remove();
    },
    getDownloadFileUrl(filename) {
      let path = '/' + this.path.join('/')
      let name = encodeURIComponent((path === '/' ? '/' : (path + '/')) + filename);
      return `/api/download?filename=${name}&token=${getToken()}&timestamp=${new Date().getTime()}`;
    },
    copyMsg(data, event) {
      console.log("data", data)
      console.log("event", event)
      copyClipboard(data, event)
    },
    showMsgForm() {
      this.msgFormVisible = true
      this.msgForm = {message: ''}
    },
    submitMsgForm() {
      this.msgFormVisible = false
      uploadMsg(this.msgForm).then(() => {
        ElMessage({message: '发送成功', type: 'success'})
        this.showFiles()
      })
    }
  },
  computed: {
    isPC() {
      return window.innerWidth > 500;
    },
    listHeight() {
      return window.innerHeight - 260;
    }
  },
}
</script>
<style lang="scss">
@import '../assets/font/DancingScript.css';

.pointer {
  cursor: pointer;
}

.select-all-btn {
  float: left;
  margin-left: 10px;
  margin-bottom: 4px;
}

.header-breadcrumb {
  padding-top: 7px;
  margin-left: 40px
}

.body {
  max-width: 750px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 16px;
}

.header .overlay {
  width: 100%;
  margin: 0 auto;
  height: 100%;
  padding: 8px;
  color: #FFF;
}

.file-desc {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.file {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.filename {
  line-height: 2em;
  margin-left: 18px;
}

.username {
  line-height: 2em;
  font-size: 12px;
  margin-left: 12px;
  color: #909399;
}

h1 {
  font-family: 'DancingScript', cursive;
  font-size: 60px;
  margin-bottom: 15px;
  margin-top: 8px;
}

h3 {
  font-family: 'Open Sans', sans-serif;
  margin-bottom: 30px;
  display: block;
  font-size: 1em;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0;
  margin-inline-end: 0;
  font-weight: bold;
}

.row-bg {
  align-items: center;
}

.button-group {
  margin-bottom: 32px;
}

.list-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.file-list {
  max-width: 750px;
  width: 95%;
  margin: 0 auto;
}

.dialog {
  max-width: 700px;
  width: 95%;
}

.cell {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.file-image {
  width: 2em;
  height: 2em;
  overflow: hidden;
  vertical-align: middle;
}
</style>

<style>
/** ------- pc端 --------- **/
@media only screen and (min-width: 500px) {
  .el-upload-dragger .el-icon-upload {
    font-size: 46px !important;
    margin: 0 !important;
  }

  .el-upload-dragger {
    width: 500px !important;
    margin-bottom: 16px;
  }
}

/** ------- 移动端 ---------- **/
@media only screen and (max-width: 500px) {
  .el-upload-dragger .el-icon-upload {
    font-size: 46px !important;
    margin: 0 !important;
  }

  .el-upload-dragger {
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 16px;
  }
}

</style>
