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

      <main class="workspace">
        <!-- 左侧：共享文件 -->
        <section v-if="viewLayout !== 'chat'" class="panel file-panel">
          <header class="panel-header">
            <span class="panel-icon file-icon">
              <el-icon :size="17">
                <FolderOpened />
              </el-icon>
            </span>
            <span class="panel-title">{{ $t("filePage.shareList") }}</span>
            <div class="panel-actions">
              <el-tooltip v-if="permissions.download" effect="dark" :content="$t('filePage.batchDownload')"
                          placement="bottom">
                <el-button class="icon-btn" text :disabled="!batchDownload" @click="batchDownloadHandler">
                  <el-icon :size="17">
                    <Download />
                  </el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="permissions.uploadFile" effect="dark" :content="$t('filePage.uploadFile')"
                          placement="bottom">
                <el-button class="icon-btn" text @click="fileFormVisible = true">
                  <el-icon :size="17">
                    <Plus />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </header>
          <div class="panel-toolbar">
            <el-checkbox class="select-all" @change="selectAll"></el-checkbox>
            <el-breadcrumb class="toolbar-breadcrumb" separator="/">
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
            <el-input class="toolbar-search" v-model="query" clearable :prefix-icon="SearchIcon"
                      :placeholder="$t('filePage.search')"></el-input>
          </div>
          <div class="panel-body">
            <template v-if="filteredFiles.length">
              <div v-for="file in filteredFiles" :key="file.name" class="file-row">
                <el-checkbox class="row-check" v-model="file.selected"
                             @change="onSelectHandler(file.name)"></el-checkbox>
                <span v-if="file.type === 'directory'" class="file-badge dir-badge">
                  <el-icon :size="18">
                    <Folder />
                  </el-icon>
                </span>
                <span v-else class="file-badge" :style="{ backgroundColor: fileBadge(file).color }">
                  {{ fileBadge(file).label }}
                </span>
                <div class="file-info" :class="{ pointer: file.type === 'directory' }"
                     @click="openDirectory(file, $event)">
                  <el-tooltip effect="light" placement="top" :content="file.name">
                    <span class="file-name">{{ file.name }}</span>
                  </el-tooltip>
                  <span v-if="file.username" class="file-sub">
                    {{ $t("filePage.sharedBy", { name: file.username }) }}
                  </span>
                </div>
                <div class="file-actions">
                  <el-tooltip v-if="permissions.download" effect="dark" :content="$t('filePage.download')"
                              placement="bottom">
                    <el-button class="icon-btn" text @click.stop="handleDownload(file)">
                      <el-icon>
                        <Download />
                      </el-icon>
                    </el-button>
                  </el-tooltip>
                  <!-- 自定义排序（仅根目录分享列表） -->
                  <template v-if="path.length === 0">
                    <el-tooltip effect="dark" :content="file.pinned ? $t('filePage.unpin') : $t('filePage.pin')"
                                placement="bottom">
                      <el-button class="icon-btn" :class="{ pinned: file.pinned }" text
                                 @click.stop="handleSort(file, file.pinned ? 'unpin' : 'pin')">
                        <el-icon>
                          <Top />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip effect="dark" :content="$t('filePage.moveUp')" placement="bottom">
                      <el-button class="icon-btn" text @click.stop="handleSort(file, 'up')">
                        <el-icon>
                          <ArrowUp />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip effect="dark" :content="$t('filePage.moveDown')" placement="bottom">
                      <el-button class="icon-btn" text @click.stop="handleSort(file, 'down')">
                        <el-icon>
                          <ArrowDown />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                  </template>
                </div>
              </div>
            </template>
            <!-- 空状态 -->
            <div v-else class="panel-empty">
              <el-icon :size="40" class="empty-icon">
                <Folder />
              </el-icon>
              <div class="empty-title">
                {{ query ? $t("filePage.searchNoResult") : $t("filePage.noFiles") }}
              </div>
              <div v-if="!query" class="empty-tip">{{ $t("filePage.noFilesTip") }}</div>
              <el-button v-else text type="primary" @click="query = ''">{{ $t("filePage.clearSearch") }}</el-button>
            </div>
          </div>
          <footer class="panel-footer">
            {{ $t("filePage.fileCount", { count: filteredFiles.length }) }}
          </footer>
        </section>

        <!-- 右侧：共享文本 -->
        <section v-if="viewLayout !== 'file'" class="panel text-panel">
          <header class="panel-header">
            <span class="panel-icon text-icon">
              <el-icon :size="17">
                <ChatDotRound />
              </el-icon>
            </span>
            <span class="panel-title">{{ $t("filePage.chatRoom") }}</span>
            <div class="panel-actions">
              <el-tooltip v-if="permissions.uploadText" effect="dark" :content="$t('filePage.shareText')"
                          placement="bottom">
                <el-button class="icon-btn" text @click="showMsgForm">
                  <el-icon :size="17">
                    <EditPen />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </header>
          <div ref="chatBox" class="panel-body msg-list">
            <template v-if="texts.length">
              <div v-for="msg in texts" :key="msg.name" class="msg-card">
                <div class="msg-head">
                  <span class="msg-avatar" :style="{ backgroundColor: avatarColor(msg.nickname || msg.username) }">
                    {{ (msg.nickname || msg.username || "?").charAt(0) }}
                  </span>
                  <span class="msg-name">{{ msg.nickname || msg.username }}</span>
                  <span v-if="msg.nickname && msg.username" class="msg-ip">{{ msg.username }}</span>
                  <span class="msg-head-space"></span>
                  <el-button class="icon-btn" text :title="$t('filePage.copyText')"
                             @click="copyMsg(msg.content, $event)">
                    <el-icon>
                      <CopyDocument />
                    </el-icon>
                  </el-button>
                </div>
                <div class="msg-bubble" :class="{ clamp: isLongText(msg) }">
                  <div class="bubble-text">{{ msg.content }}</div>
                </div>
                <el-button v-if="isLongText(msg)" text type="primary" class="msg-more"
                           @click="showFullText(msg)">
                  {{ $t("filePage.viewFullText") }}
                  <el-icon>
                    <ArrowDown />
                  </el-icon>
                </el-button>
              </div>
            </template>
            <!-- 空状态 -->
            <div v-else class="panel-empty">
              <el-icon :size="40" class="empty-icon">
                <ChatDotRound />
              </el-icon>
              <div class="empty-title">{{ $t("filePage.noText") }}</div>
            </div>
          </div>
          <footer class="panel-composer">
            <el-input
              v-model="chatNickname"
              class="composer-nickname"
              :placeholder="$t('filePage.nicknamePlaceholder')"
              clearable
            ></el-input>
            <el-input
              v-model="chatMessage"
              class="composer-textarea"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              :placeholder="$t('filePage.chatInputPlaceholder')"
              @keydown.ctrl.enter.prevent="submitChat"
              @keydown.meta.enter.prevent="submitChat"
            ></el-input>
            <el-button type="primary" @click="submitChat">{{ $t("filePage.send") }}</el-button>
          </footer>
          <footer class="panel-footer">
            {{ $t("filePage.textCount", { count: texts.length }) }}
          </footer>
        </section>
      </main>

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

      <!-- 查看全文弹窗 -->
      <el-dialog
        :title="$t('filePage.fullTextTitle')"
        class="dialog"
        width="560px"
        append-to-body
        v-model="fullTextVisible">
        <div v-if="fullTextMsg" class="fulltext-meta">
          <span class="msg-avatar" :style="{ backgroundColor: avatarColor(fullTextMsg.nickname || fullTextMsg.username) }">
            {{ (fullTextMsg.nickname || fullTextMsg.username || "?").charAt(0) }}
          </span>
          <span class="msg-name">{{ fullTextMsg.nickname || fullTextMsg.username }}</span>
          <span v-if="fullTextMsg.nickname && fullTextMsg.username" class="msg-ip">{{ fullTextMsg.username }}</span>
        </div>
        <div class="fulltext-body">{{ fullTextMsg && fullTextMsg.content }}</div>
        <template #footer>
        <span class="dialog-footer">
          <el-button @click="fullTextVisible = false">{{ $t("common.close") }}</el-button>
          <el-button type="primary" @click="copyFullText($event)">
            <el-icon>
              <CopyDocument />
            </el-icon>
            {{ $t("filePage.copyFullText") }}
          </el-button>
        </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script>
import {getTusConfig, listFiles, listTexts, sortFile, uploadMsg} from "@/api/FileApi";
import {getToken, logout} from "@/utils/auth";
import {ElMessage, ElMessageBox} from "element-plus";
import {copyClipboard} from '@/utils/clipboard'
import {
  ArrowDown,
  ArrowUp,
  ChatDotRound,
  CopyDocument,
  Download,
  EditPen,
  Folder,
  FolderOpened,
  Plus,
  Search as SearchIcon,
  Top,
  UploadFilled,
  User
} from '@element-plus/icons-vue'
import {getSetting} from "@/api/SettingApi";
import { t } from '@/i18n'

// 文件类型徽标映射：{ 后缀: [徽标文字, 颜色] }
const FILE_BADGES = {
  doc: ['W', '#2f6fe4'],
  docx: ['W', '#2f6fe4'],
  xls: ['X', '#1f9d55'],
  xlsx: ['X', '#1f9d55'],
  csv: ['X', '#1f9d55'],
  ppt: ['P', '#d97706'],
  pptx: ['P', '#d97706'],
  pdf: ['PDF', '#e5484d'],
  png: ['IMG', '#8b5cf6'],
  jpg: ['IMG', '#8b5cf6'],
  jpeg: ['IMG', '#8b5cf6'],
  gif: ['IMG', '#8b5cf6'],
  webp: ['IMG', '#8b5cf6'],
  svg: ['IMG', '#8b5cf6'],
  bmp: ['IMG', '#8b5cf6'],
  zip: ['ZIP', '#f59e0b'],
  rar: ['ZIP', '#f59e0b'],
  '7z': ['ZIP', '#f59e0b'],
  tar: ['ZIP', '#f59e0b'],
  gz: ['ZIP', '#f59e0b'],
  exe: ['EXE', '#64748b'],
  dmg: ['EXE', '#64748b'],
  msi: ['EXE', '#64748b'],
  deb: ['EXE', '#64748b'],
  pkg: ['EXE', '#64748b'],
  mp4: ['MP4', '#ec4899'],
  mov: ['MP4', '#ec4899'],
  avi: ['MP4', '#ec4899'],
  mkv: ['MP4', '#ec4899'],
  mp3: ['MP3', '#14b8a6'],
  wav: ['MP3', '#14b8a6'],
  flac: ['MP3', '#14b8a6'],
  txt: ['TXT', '#0ea5e9'],
  md: ['TXT', '#0ea5e9'],
  json: ['TXT', '#0ea5e9'],
  log: ['TXT', '#0ea5e9'],
};
const DEFAULT_BADGE = ['FILE', '#7c8db5'];

// 长文本折叠阈值：超过 6 行或 200 字符时折叠
const LONG_TEXT_LINES = 6;
const LONG_TEXT_CHARS = 200;

export default {
  name: 'HomeView',
  components: {
    ArrowDown,
    ArrowUp,
    ChatDotRound,
    CopyDocument,
    Download,
    EditPen,
    Folder,
    FolderOpened,
    Plus,
    Top,
    UploadFilled,
    User
  },
  data() {
    return {
      SearchIcon,
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
      // 查看全文弹窗
      fullTextVisible: false,
      fullTextMsg: null,
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
    // 文件类型徽标
    fileBadge(file) {
      const name = file.name || ''
      const dot = name.lastIndexOf('.')
      const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : ''
      const badge = FILE_BADGES[ext]
      return {
        label: badge ? badge[0] : DEFAULT_BADGE[0],
        color: badge ? badge[1] : DEFAULT_BADGE[1]
      }
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
    handleDownload(item) {
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
      copyClipboard(data, event)
    },
    // 长文本折叠判断
    isLongText(msg) {
      const content = (msg && msg.content) || ''
      return content.split('\n').length > LONG_TEXT_LINES || content.length > LONG_TEXT_CHARS
    },
    showFullText(msg) {
      this.fullTextMsg = msg
      this.fullTextVisible = true
    },
    copyFullText(event) {
      if (this.fullTextMsg) {
        copyClipboard(this.fullTextMsg.content, event)
      }
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

.dialog {
  max-width: 700px;
  width: 95%;
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

/* ===== 双视图工作区 ===== */
.workspace {
  display: flex;
  gap: 16px;
  height: calc(100vh - 340px);
  min-height: 380px;
}

.panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(31, 45, 61, 0.05);
  overflow: hidden;
}

.file-panel {
  flex: 1 1 55%;
}

.text-panel {
  flex: 1 1 45%;
}

/* 面板头部 */
.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
}

.panel-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.panel-icon.file-icon {
  color: #2160e8;
  background: #e8effc;
}

.panel-icon.text-icon {
  color: #16a34a;
  background: #e5f6ec;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.danger-icon-btn:hover {
  color: var(--el-color-danger) !important;
  background: #fdecec !important;
}

/* 面板工具栏 */
.panel-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 16px 12px;
}

.select-all {
  flex-shrink: 0;
  margin-right: 0;
}

.toolbar-breadcrumb {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}

.toolbar-search {
  flex-shrink: 0;
  width: 180px;
}

/* 面板内容区（独立滚动） */
.panel-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid #f0f2f7;
}

.panel-body::-webkit-scrollbar {
  display: block;
  width: 6px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(31, 45, 61, 0.15);
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-track {
  background: transparent;
}

/* 面板底部统计 */
.panel-footer {
  flex-shrink: 0;
  padding: 8px 16px;
  font-size: 12px;
  color: #98a2b3;
  border-top: 1px solid rgba(240, 242, 247, 0.8);
  background: rgba(250, 251, 253, 0.35);
}

/* ===== 文件列表 ===== */
.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 6px 16px;
  border-bottom: 1px solid #f5f7fa;
  transition: background 0.12s;
}

.file-row:hover {
  background: #f7f9fd;
}

.file-row:last-child {
  border-bottom: none;
}

.row-check {
  flex-shrink: 0;
  margin-right: -4px;
}

.file-badge {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.file-badge.dir-badge {
  color: #b7791f;
  background: #fdf3df;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-sub {
  font-size: 12px;
  color: #98a2b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.55;
  transition: opacity 0.12s;
}

.file-row:hover .file-actions,
.msg-card:hover .msg-head .icon-btn {
  opacity: 1;
}

.file-actions .icon-btn {
  opacity: inherit;
}

.file-actions .icon-btn.pinned {
  color: var(--el-color-warning);
  opacity: 1;
}

/* ===== 消息流 ===== */
.msg-list {
  padding: 12px 14px;
  background: rgba(250, 251, 253, 0.35);
}

.msg-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.msg-card:hover {
  border-color: #e2e8f3;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.07);
}

.msg-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.msg-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.msg-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-ip {
  font-size: 12px;
  color: #98a2b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-head-space {
  flex: 1;
}

.msg-head .icon-btn {
  opacity: 0.55;
}

.msg-bubble {
  background: rgba(245, 247, 250, 0.8);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.65;
  color: #303133;
}

.bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* 长文本折叠：默认显示前 5 行（部分内核不支持 -webkit-box，使用 max-height 兜底） */
.msg-bubble.clamp .bubble-text {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: calc(1.65em * 5);
}

.msg-more {
  margin-top: 4px;
  padding: 4px 0;
  height: auto;
  font-size: 12px;
}

/* 消息输入区 */
.panel-composer {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f2f7;
}

.composer-nickname {
  width: 120px;
  flex-shrink: 0;
}

.composer-textarea {
  flex: 1;
  min-width: 0;
}

/* ===== 空状态 ===== */
.panel-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.empty-icon {
  color: #c4cddb;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #5a6b85;
}

.empty-tip {
  font-size: 12px;
  color: #98a2b3;
  max-width: 260px;
  line-height: 1.6;
}

/* ===== 查看全文弹窗 ===== */
.fulltext-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.fulltext-body {
  max-height: 55vh;
  overflow-y: auto;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.fulltext-body::-webkit-scrollbar {
  display: block;
  width: 6px;
}

.fulltext-body::-webkit-scrollbar-thumb {
  background: rgba(31, 45, 61, 0.15);
  border-radius: 3px;
}

/* ===== 通用 ===== */
.icon-btn {
  padding: 6px;
  color: #5a6b85;
}

.icon-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 双视图模式加宽容器 */
.body.dual-mode {
  max-width: 1200px;
}

@media only screen and (max-width: 600px) {
  .workspace {
    flex-direction: column;
    height: auto;
    min-height: 0;
  }

  .file-panel,
  .text-panel {
    flex: 1 1 auto;
  }

  .panel-body {
    flex: none;
    height: 45vh;
  }

  .panel-toolbar {
    flex-wrap: wrap;
  }

  .toolbar-search {
    width: 100%;
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
