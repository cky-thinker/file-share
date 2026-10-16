<template>
  <div>
    <div class="body" :class="viewLayout === 'dual' ? 'dual-mode' : ''">
      <div class="header">
        <div class="overlay">
          <div class="header-content">
            <div class="title-section">
              <h1>File Share</h1>
              <h3>{{ $t("filePage.slogan") }}</h3>
            </div>
            <div v-if="authEnable || permissions.admin" class="user-section">
              <button v-if="permissions.admin" @click="goAccountManager" class="logout-btn">
                <el-icon class="logout-icon"><Setting /></el-icon>
                <span>{{ $t("filePage.accountManage") }}</span>
              </button>
              <button @click="handleLogout" class="logout-btn">
                <el-icon class="logout-icon"><User /></el-icon>
                <span>{{ $t("filePage.logout") }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="layout-switcher">
        <div class="switch-group">
          <button :class="['switch-btn', viewLayout === 'dual' ? 'active' : '']" @click="switchLayout('dual')">
            {{ $t("filePage.viewDual") }}
          </button>
          <button :class="['switch-btn', viewLayout === 'file' ? 'active' : '']" @click="switchLayout('file')">
            {{ $t("filePage.viewFiles") }}
          </button>
          <button :class="['switch-btn', viewLayout === 'chat' ? 'active' : '']" @click="switchLayout('chat')">
            {{ $t("filePage.viewChat") }}
          </button>
        </div>
      </div>

      <div class="view-content">
        <div v-if="viewLayout !== 'chat'" class="panel file-panel">
          <el-card class="file-list">
            <template #header>
              <div class="file-header">
                <div class="file-header-left">
                  <span class="file-header-title">{{ $t("filePage.shareList") }}</span>
                  <el-button v-if="permissions.download && batchDownload" @click="batchDownloadHandler">
                    <svg-icon name="批量下载"/>
                    {{ isPC ? $t("filePage.batchDownload") : "" }}
                  </el-button>
                  <el-button v-if="permissions.createDirectory" @click="dirFormVisible = true">
                    <svg-icon name="file-directory"/>
                    {{ isPC ? $t("filePage.createFolder") : "" }}
                  </el-button>
                </div>
                <div class="file-header-right">
                  <el-button v-if="permissions.uploadFile" @click="fileFormVisible = true">
                    <svg-icon name="发送文件"/>
                    {{ isPC ? $t("filePage.uploadFile") : "" }}
                  </el-button>
                  <el-button v-if="permissions.uploadText" @click="showMsgForm" type="default" :title="$t('filePage.shareText')">
                    <svg-icon name="发送消息"/>
                    {{ isPC ? $t("filePage.uploadText") : "" }}
                  </el-button>
                </div>
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
            <el-table-column width="130" align="center">
              <template #default="scope">
                <el-button v-if="['file', 'directory'].includes(scope.row.type) && permissions.download"
                           @click="handleDownload(scope.row, $event)" plain>
                  <el-icon size="16">
                    <Download/>
                  </el-icon>
                </el-button>
                <el-button v-if="scope.row.type === 'file' && permissions.removeFile"
                           @click="handleRemoveFile(scope.row, $event)" plain type="danger">
                  <el-icon size="16">
                    <Delete/>
                  </el-icon>
                </el-button>
                <el-button v-if="scope.row.type === 'directory' && permissions.removeDirectory"
                           @click="handleRemoveDirectory(scope.row, $event)" plain type="danger">
                  <el-icon size="16">
                    <Delete/>
                  </el-icon>
                </el-button>
              </template>
            </el-table-column>
            <!-- 自定义排序（仅根目录分享列表） -->
            <el-table-column v-if="path.length === 0" width="118" align="center">
              <template #default="scope">
                <el-tooltip effect="light" :content="scope.row.pinned ? $t('filePage.unpin') : $t('filePage.pin')">
                  <el-button size="small" :type="scope.row.pinned ? 'warning' : 'default'" plain
                             @click="handleSort(scope.row, scope.row.pinned ? 'unpin' : 'pin')">
                    <el-icon size="14"><Top/></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="light" :content="$t('filePage.moveUp')">
                  <el-button size="small" @click="handleSort(scope.row, 'up')">
                    <el-icon size="14"><ArrowUp/></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip effect="light" :content="$t('filePage.moveDown')">
                  <el-button size="small" @click="handleSort(scope.row, 'down')">
                    <el-icon size="14"><ArrowDown/></el-icon>
                  </el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
        </div> <!-- file-panel -->

        <div v-if="viewLayout !== 'file'" class="panel chat-panel">
          <el-card class="chat-card">
            <template #header>
              <div class="chat-header">
                <span>{{ $t("filePage.chatRoom") }}</span>
                <span class="chat-count">{{ texts.length }}</span>
              </div>
            </template>
            <div ref="chatBox" class="chat-messages">
              <div v-if="texts.length === 0" class="chat-empty">
                {{ $t("filePage.noText") }}
              </div>
              <div v-for="msg in texts" :key="msg.name" class="chat-msg">
                <div class="chat-avatar" :style="{ backgroundColor: avatarColor(msg.nickname || msg.username) }">
                  {{ (msg.nickname || msg.username || '?').charAt(0) }}
                </div>
                <div class="chat-main">
                  <div class="chat-name">{{ msg.nickname || msg.username }}</div>
                  <div class="chat-bubble">{{ msg.content }}</div>
                </div>
              </div>
            </div>
            <div class="chat-input-row">
              <el-input
                v-model="chatNickname"
                class="chat-nickname"
                :placeholder="$t('filePage.nicknamePlaceholder')"
                clearable
              ></el-input>
              <el-input
                v-model="chatMessage"
                class="chat-textarea"
                type="textarea"
                :rows="2"
                :placeholder="$t('filePage.chatInputPlaceholder')"
                @keydown.ctrl.enter.prevent="submitChat"
                @keydown.meta.enter.prevent="submitChat"
              ></el-input>
              <el-button type="primary" @click="submitChat">{{ $t("filePage.send") }}</el-button>
            </div>
          </el-card>
        </div>
      </div> <!-- view-content -->
      <el-dialog
        :title="$t('filePage.shareFile')"
        name="file"
        class="dialog"
        v-model="fileFormVisible">
        <div style="display: flex; justify-content: center">
          <el-upload
            drag
            :action="uploadAction"
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
          <el-form-item :label="$t('filePage.nickname')">
            <el-input v-model="msgForm.nickname" :placeholder="$t('filePage.nicknamePlaceholder')"></el-input>
          </el-form-item>
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
      <el-dialog
        :title="$t('filePage.createFolder')"
        class="dialog"
        width="400px"
        v-model="dirFormVisible">
        <el-input
          v-model="dirForm.name"
          :placeholder="$t('filePage.folderName')"
          maxlength="50"
          @keyup.enter="submitDirForm"
        ></el-input>
        <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitDirForm">{{ $t("filePage.confirm") }}</el-button>
          <el-button @click="dirFormVisible = false">{{ $t("filePage.cancel") }}</el-button>
        </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script>
import FileIcon from "@/components/FileIcon";
import SvgIcon from "@/components/SvgIcon";
import {createDirectory, getTusConfig, listFiles, listTexts, removeFile, removeDirectory, sortFile, uploadMsg} from "@/api/FileApi";
import {getToken, logout} from "@/utils/auth";
import {ElMessage, ElMessageBox} from "element-plus";
import {copyClipboard} from '@/utils/clipboard'
import {isPicture} from "@/utils/fileUtil";
import {ArrowDown, ArrowUp, Delete, Download, Search, Setting, Top, UploadFilled, User} from '@element-plus/icons-vue'
import {getSetting} from "@/api/SettingApi";
import { t } from '@/i18n'

export default {
  name: 'HomeView',
  components: {
    FileIcon, SvgIcon, Delete, Download, UploadFilled, User, Search, Setting, ArrowUp, ArrowDown, Top
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
        message: '',
        nickname: ''
      },
      // 新建文件夹表单
      dirFormVisible: false,
      dirForm: {
        name: ''
      },

      // 共享文件列表
      path: [],
      files: [],
      query: undefined,
      authEnable: true,
      uploadToFolderEnable: false,
      // 视图布局：dual 双视图 / file 仅文件 / chat 仅聊天
      viewLayout: localStorage.getItem('fileShareViewLayout') || 'dual',
      texts: [],
      chatMessage: '',
      chatNickname: localStorage.getItem('fileShareNickname') || '',
      permissions: {
        download: true,
        uploadFile: true,
        uploadText: true,
        createDirectory: true,
        removeDirectory: true,
        removeFile: true,
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
    this.uploadToFolderEnable = settingRes.data.uploadToFolderEnable
    if (settingRes.data.permissions) {
      this.permissions = settingRes.data.permissions
    }
    this.refreshPath();
    await this.showFiles();
    await this.loadTexts();
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
    },
    texts: function () {
      this.$nextTick(() => {
        let box = this.$refs.chatBox
        if (box) {
          box.scrollTop = box.scrollHeight
        }
      })
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
            this.loadTexts()
          }
        };
      } else {
        setInterval(() => {
          this.showFiles()
          this.loadTexts()
        }, 3000)
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
      this.msgForm = {message: '', nickname: localStorage.getItem('fileShareNickname') || ''}
    },
    submitMsgForm() {
      let nickname = (this.msgForm.nickname || '').trim()
      if (nickname) {
        localStorage.setItem('fileShareNickname', nickname)
      }
      this.msgFormVisible = false
      uploadMsg({message: this.msgForm.message, nickname}).then(() => {
        ElMessage({message: t('filePage.sendSuccess'), type: 'success'})
        this.loadTexts()
        this.showFiles()
      })
    },
    switchLayout(mode) {
      this.viewLayout = mode
      localStorage.setItem('fileShareViewLayout', mode)
      this.$nextTick(() => {
        let box = this.$refs.chatBox
        if (box) {
          box.scrollTop = box.scrollHeight
        }
      })
    },
    // 昵称/IP 生成稳定 hash 色
    avatarColor(str) {
      if (!str) {
        str = '?'
      }
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      let h = Math.abs(hash) % 360
      return `hsl(${h}, 65%, 55%)`
    },
    loadTexts() {
      return listTexts().then(res => {
        this.texts = res.data || []
      }).catch(() => {
        this.texts = []
      })
    },
    submitChat() {
      let message = this.chatMessage.trim()
      if (!message) {
        return
      }
      let nickname = this.chatNickname.trim()
      if (nickname) {
        localStorage.setItem('fileShareNickname', nickname)
      }
      uploadMsg({message, nickname}).then(() => {
        this.chatMessage = ''
        this.loadTexts()
      })
    },
    submitDirForm() {
      let name = (this.dirForm.name || '').trim()
      if (!name) {
        ElMessage({message: t('filePage.folderNameRequired'), type: 'warning'})
        return
      }
      createDirectory({path: this.path.join('/'), name}).then(() => {
        ElMessage({message: t('filePage.createFolderSuccess'), type: 'success'})
        this.dirFormVisible = false
        this.dirForm.name = ''
        this.showFiles()
      }).catch(e => {
        ElMessage({message: (e && e.message) || t('filePage.createFolderFail'), type: 'error'})
      })
    },
    handleRemoveFile(item, event) {
      if (event && event.stopPropagation) {
        event.stopPropagation()
      }
      ElMessageBox.confirm(t('filePage.deleteFileConfirm', {name: item.name}), t('filePage.deleteConfirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }).then(() => {
        removeFile({path: this.path.join('/'), name: item.name}).then(() => {
          ElMessage({message: t('filePage.deleteSuccess'), type: 'success'})
          this.showFiles()
        }).catch(e => {
          ElMessage({message: (e && e.message) || t('filePage.deleteFail'), type: 'error'})
        })
      }).catch(() => {
        // 用户取消删除
      })
    },
    handleRemoveDirectory(item, event) {
      if (event && event.stopPropagation) {
        event.stopPropagation()
      }
      ElMessageBox.confirm(t('filePage.deleteFolderConfirm', {name: item.name}), t('filePage.deleteConfirmTitle'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }).then(() => {
        removeDirectory({path: this.path.join('/'), name: item.name}).then(() => {
          ElMessage({message: t('filePage.deleteSuccess'), type: 'success'})
          this.showFiles()
        }).catch(e => {
          ElMessage({message: (e && e.message) || t('filePage.deleteFail'), type: 'error'})
        })
      }).catch(() => {
        // 用户取消删除
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
    },
    goAccountManager() {
      this.$router.push('/account')
    },
    // 置顶/取消置顶/上移/下移（仅根目录分享条目）
    async handleSort(item, action) {
      try {
        await sortFile({name: item.name, action})
        await this.showFiles()
        await this.loadTexts()
      } catch (e) {
        ElMessage.error(e.message || t('common.operationFail'))
      }
    }
  },
  computed: {
    isPC() {
      return window.innerWidth > 500;
    },
    listHeight() {
      return window.innerHeight - 260;
    },
    // 文件视图仅展示文件与文件夹，文本消息进入聊天视图
    fileItems() {
      return this.files.filter(file => file.type !== 'text');
    },
    filteredFiles() {
      if (!this.query) return this.fileItems;

      // 将查询转换为正则表达式，如 "sc" -> /.*s.*c.*/i
      const pattern = this.query.split('').join('.*');
      const regex = new RegExp(pattern, 'i');

      return this.fileItems.filter(file => regex.test(file.name));
    },
    // 上传到当前文件夹时，action 携带当前相对路径
    uploadAction() {
      if (this.uploadToFolderEnable && this.path.length > 0) {
        return '/api/addFile?path=' + encodeURIComponent(this.path.join('/'))
      }
      return '/api/addFile'
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

.layout-switcher {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.switch-group {
  display: inline-flex;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.switch-btn {
  border: none;
  background: transparent;
  padding: 6px 18px;
  border-radius: 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 500;
}

.view-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.view-content .panel {
  flex: 1;
  min-width: 0;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.file-header-left,
.file-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-header-title {
  margin-right: 8px;
  font-weight: 600;
}

.chat-card {
  max-width: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-count {
  color: #909399;
  font-size: 13px;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 8px 4px;
}

.chat-empty {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.chat-msg {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}

.chat-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 10px;
  user-select: none;
}

.chat-main {
  min-width: 0;
  flex: 1;
}

.chat-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.chat-bubble {
  display: inline-block;
  background: #f0f2f5;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

.chat-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.chat-nickname {
  width: 120px;
  flex-shrink: 0;
}

.chat-textarea {
  flex: 1;
  min-width: 0;
}

/* 双视图模式加宽容器 */
.body.dual-mode {
  max-width: 1200px;
}

.body.dual-mode .file-list,
.body.dual-mode .chat-card {
  max-width: 100%;
  width: 100%;
  margin: 0;
}

/* 单视图时聊天面板卡片保持原有宽度 */
.body:not(.dual-mode) .chat-card {
  max-width: 750px;
  width: 95%;
  margin: 0 auto;
}

@media only screen and (max-width: 500px) {
  .view-content {
    flex-direction: column;
  }

  .chat-messages {
    height: 320px;
  }

  .switch-btn {
    padding: 5px 12px;
    font-size: 13px;
  }
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
