<template>
  <div>
    <div class="body">
      <div class="header">
        <div class="overlay">
          <div class="header-content">
            <div class="title-section">
              <h1>File Share</h1>
              <h3>{{ $t("filePage.slogan") }}</h3>
            </div>
            <div v-if="authEnable" class="user-section">
              <button @click="handleLogout" class="logout-btn">
                <el-icon class="logout-icon"><User /></el-icon>
                <span>{{ $t("filePage.logout") }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <el-card class="file-list">
        <template #header>
          <div class="clearfix">
            <el-row class="row-bg">
              <el-col :span="12">
                <span style="margin-right: 20px">{{
                  $t("filePage.shareList")
                }}</span>
                <el-button v-if="permissions.download && batchDownload" @click="batchDownloadHandler">
                  <svg-icon name="批量下载"/>
                  {{ isPC ? $t("filePage.batchDownload") : "" }}
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button v-if="permissions.uploadFile" @click="fileFormVisible= true">
                  <svg-icon name="发送文件"/>
                  {{ isPC ? $t("filePage.uploadFile") : "" }}
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button v-if="permissions.uploadText" @click="showMsgForm" type="default" :title="$t('filePage.shareText')">
                  <svg-icon name="发送消息"/>
                  {{ isPC ? $t("filePage.uploadText") : "" }}
                </el-button>
              </el-col>
            </el-row>
          </div>
        </template>

        <div class="flex pl-4 pr-4">
          <div class="flex-7">
            <el-checkbox class="select-all-btn" @change="selectAll"></el-checkbox>
            <el-breadcrumb class="header-breadcrumb" separator="/">
              <el-breadcrumb-item>
                <el-link :underline="false" @click="skipPath(0)">
                  {{ $t("filePage.home") }}
                </el-link>
              </el-breadcrumb-item>
              <el-breadcrumb-item v-bind:key="idx" v-for="(p, idx) in path">
                <el-link :underline="false" @click="skipPath(idx + 1)">
                  {{ p }}
                </el-link>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="flex-3">
            <el-input
              :placeholder="$t('filePage.search')"
              v-model="query">
              <template #prefix>
                <el-icon class="el-input__icon">
                  <search/>
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>
        <div style="padding-left: 16px; padding-right: 16px">
          <el-table
            :max-height="listHeight"
            :show-header="false"
            :data="filteredFiles"
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
                              :content="$t('filePage.sharedBy', { name: scope.row.username })"
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
                <el-button v-if="['file', 'directory'].includes(scope.row.type) && permissions.download"
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
        :title="$t('filePage.shareFile')"
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
            <div class="el-upload__text" v-html="$t('filePage.uploadDragText')"></div>
          </el-upload>
        </div>
      </el-dialog>
      <el-dialog
        :title="$t('filePage.shareTextTitle')"
        class="dialog"
        v-model="msgFormVisible">
        <el-form ref="form" :model="msgForm" label-width="80px">
          <el-form-item :label="$t('filePage.textContent')">
            <el-input type="textarea" :rows="5" v-model="msgForm.message"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitMsgForm">{{ $t("filePage.submit") }}</el-button>
          <el-button @click="msgFormVisible = false">{{ $t("filePage.cancel") }}</el-button>
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
import {getToken, logout} from "@/utils/auth";
import {ElMessage, ElMessageBox} from "element-plus";
import {copyClipboard} from '@/utils/clipboard'
import {isPicture} from "@/utils/fileUtil";
import {DocumentCopy, Download, Search, UploadFilled, User} from '@element-plus/icons-vue'
import {getSetting} from "@/api/SettingApi";
import { t } from '@/i18n'

export default {
  name: 'HomeView',
  components: {
    FileIcon, SvgIcon, DocumentCopy, Download, UploadFilled, User, Search
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

      // 共享文件列表
      path: [],
      files: [],
      query: undefined,
      authEnable: true,
      permissions: {
        download: true,
        uploadFile: true,
        uploadText: true,
        allowAccess: '',
        denyAccess: ''
      },
      headers: {
        Authorization: ''
      },
      tusConfig: {},
    }
  },
  async created() {
    let settingRes = await getSetting()
    this.authEnable = settingRes.data.authEnable
    if (settingRes.data.permissions) {
      this.permissions = settingRes.data.permissions
    }
    this.refreshPath();
    await this.showFiles();
    this.updateRouter();
    // 3s更新一下列表
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
          ElMessageBox.confirm(t('filePage.downloadFolderConfirm'), t('filePage.note'), {
            confirmButtonText: t('filePage.continue'),
            cancelButtonText: t('common.cancel'),
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

    uploadSuccess(response, file, fileList) {
      console.log('---uploadSuccess---', response, file, fileList)
      ElMessage({message: t('filePage.uploadSuccess'), type: 'success'})
      this.fileList = fileList.filter((f) => {
        return f.name !== file.name;
      })
    },
    uploadError(err, file, fileList) {
      console.log('---uploadError---', err, file, fileList)
      ElMessage({message: t('filePage.uploadFail'), type: 'success'})
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
        ElMessage({message: t('filePage.sendSuccess'), type: 'success'})
        this.showFiles()
      })
    },
    handleLogout() {
      ElMessageBox.confirm(t('filePage.logoutConfirm'), t('filePage.tip'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }).then(() => {
        logout()
        ElMessage({message: t('filePage.loggedOut'), type: 'success'})
        this.$router.push('/login')
      }).catch(() => {
        // 用户取消退出
      })
    }
  },
  computed: {
    isPC() {
      return window.innerWidth > 500;
    },
    listHeight() {
      return window.innerHeight - 260;
    },
    filteredFiles() {
      if (!this.query) return this.files;

      // 将查询转换为正则表达式，如 "sc" -> /.*s.*c.*/i
      const pattern = this.query.split('').join('.*');
      const regex = new RegExp(pattern, 'i');

      return this.files.filter(file => regex.test(file.name));
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title-section {
  flex: 1;
  text-align: center;
}

.user-section {
  position: absolute;
  right: 20px;
  top: 20px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: #FFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logout-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logout-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.logout-icon {
  font-size: 16px;
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
