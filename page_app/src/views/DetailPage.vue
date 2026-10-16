<template>
<div class="detail-space">
  <!-- 共享服务信息区 -->
  <section class="info-bar">
    <div class="info-left">
      <span class="info-icon">
        <el-icon :size="18">
          <Link />
        </el-icon>
      </span>
      <span class="info-label">{{ $t("detail.shareAddress") }}</span>
      <el-tooltip effect="light" placement="top" :content="settingForm.url">
        <span class="info-url">{{ settingForm.url }}</span>
      </el-tooltip>
      <el-popover placement="bottom" :width="125" trigger="hover">
        <template #reference>
          <el-button type="primary" class="copy-btn" @click="handleClipboard(settingForm.url, $event)">
            <el-icon>
              <CopyDocument />
            </el-icon>
            &nbsp;{{ $t("detail.copyLink") }}
          </el-button>
        </template>
        <qrcode-vue :value="settingForm.url"></qrcode-vue>
      </el-popover>
    </div>
    <div class="info-right">
      <el-tooltip effect="dark" :content="$t('detail.switchIpProtocol')" placement="bottom">
        <div class="seg-toggle">
          <span class="seg-item" :class="{ active: ipFamily === 'ipv4' }"
            @click="ipFamily !== 'ipv4' && changeIpFamily()">IPv4</span>
          <span class="seg-item" :class="{ active: ipFamily === 'ipv6' }"
            @click="ipFamily !== 'ipv6' && changeIpFamily()">IPv6</span>
        </div>
      </el-tooltip>
      <el-select class="nic-select" :model-value="currentInterfaceName" :disabled="netInterfaceNames.length <= 1"
        :placeholder="$t('detail.switchNetInterface')" @change="onNicChange">
        <template #prefix>
          <el-icon>
            <Connection />
          </el-icon>
        </template>
        <el-option v-for="name in netInterfaceNames" :key="name" :label="name" :value="name" />
      </el-select>
    </div>
  </section>

  <!-- 双视图工作区 -->
  <main class="workspace">
    <!-- 左侧：共享文件 -->
    <section class="panel file-panel">
      <header class="panel-header">
        <span class="panel-icon file-icon">
          <el-icon :size="17">
            <FolderOpened />
          </el-icon>
        </span>
        <span class="panel-title">{{ $t("detail.filesTitle") }}</span>
        <div class="panel-actions">
          <el-tooltip effect="dark" :content="$t('detail.addFile')" placement="bottom">
            <el-button class="icon-btn" text @click="selectFiles">
              <el-icon :size="17">
                <Plus />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" :content="$t('detail.addFolder')" placement="bottom">
            <el-button class="icon-btn" text @click="selectFolder">
              <el-icon :size="17">
                <FolderAdd />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" :content="$t('detail.clearList')" placement="bottom">
            <el-button class="icon-btn danger-icon-btn" text :disabled="!fileItems.length" @click="clearAllFiles">
              <el-icon :size="17">
                <Delete />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </header>
      <div class="panel-toolbar">
        <el-input v-model="fileKeyword" clearable :prefix-icon="SearchIcon"
          :placeholder="$t('detail.searchFilePlaceholder')"></el-input>
        <el-dropdown trigger="click" @command="fileOrder = $event">
          <el-button class="sort-btn">
            <el-icon>
              <Sort />
            </el-icon>
            &nbsp;{{ $t("detail.sortByTime") }}
            <el-icon class="sort-caret">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="desc">
                <el-icon v-if="fileOrder === 'desc'">
                  <Check />
                </el-icon>
                <span v-else class="check-holder"></span>
                {{ $t("detail.sortNewest") }}
              </el-dropdown-item>
              <el-dropdown-item command="asc">
                <el-icon v-if="fileOrder === 'asc'">
                  <Check />
                </el-icon>
                <span v-else class="check-holder"></span>
                {{ $t("detail.sortOldest") }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="panel-body" @dragenter.prevent="onDragEnter" @dragover.prevent @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop">
        <!-- 文件列表 -->
        <template v-if="filteredFiles.length">
          <div v-for="file in filteredFiles" :key="file.name" class="file-row">
            <span v-if="file.type === 'directory'" class="file-badge dir-badge">
              <el-icon :size="18">
                <Folder />
              </el-icon>
            </span>
            <span v-else class="file-badge" :style="{ backgroundColor: fileBadge(file).color }">
              {{ fileBadge(file).label }}
            </span>
            <div class="file-info">
              <el-tooltip effect="light" placement="top" :content="file.name">
                <span class="file-name">{{ file.name }}</span>
              </el-tooltip>
              <span class="file-sub">
                {{ $t("detail.sharedFrom", { name: file.username }) }}
              </span>
            </div>
            <div class="file-actions">
              <el-popover placement="left" :width="125" trigger="hover">
                <template #reference>
                  <el-button class="icon-btn" text :title="$t('detail.copyLinkTip')"
                    @click="handleFileUrlCopy(file, $event)">
                    <el-icon>
                      <Link />
                    </el-icon>
                  </el-button>
                </template>
                <qrcode-vue :value="getFileUrl(file)"></qrcode-vue>
              </el-popover>
              <el-button class="icon-btn" text :title="$t('detail.openFileDir')" @click="openFile(file)">
                <el-icon>
                  <FolderOpened />
                </el-icon>
              </el-button>
              <el-dropdown trigger="click" @command="(cmd) => onFileCommand(cmd, file)">
                <el-button class="icon-btn" text :title="$t('detail.moreActions')">
                  <el-icon>
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="delete" class="danger-item">
                      {{ $t("detail.deleteFile") }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
        <!-- 空状态 -->
        <div v-else class="panel-empty">
          <el-icon :size="40" class="empty-icon">
            <Folder />
          </el-icon>
          <div class="empty-title">
            {{ fileKeyword ? $t("detail.searchNoResult") : $t("detail.noFiles") }}
          </div>
          <div v-if="!fileKeyword" class="empty-tip">
            {{ $t("detail.noFilesTip") }}
          </div>
          <el-button v-else text type="primary" @click="fileKeyword = ''">{{ $t("detail.clearSearch") }}</el-button>
        </div>
        <!-- 拖拽覆盖层 -->
        <transition name="fade">
          <div v-if="dragCount > 0" class="drop-overlay">
            <el-icon :size="36">
              <UploadFilled />
            </el-icon>
            <div class="drop-text">{{ $t("detail.dropToAdd") }}</div>
          </div>
        </transition>
      </div>
      <footer class="panel-footer">
        {{ $t("detail.fileCount", { count: filteredFiles.length }) }}
      </footer>
    </section>

    <!-- 右侧：共享文本 -->
    <section class="panel text-panel">
      <header class="panel-header">
        <span class="panel-icon text-icon">
          <el-icon :size="17">
            <ChatDotRound />
          </el-icon>
        </span>
        <span class="panel-title">{{ $t("detail.textsTitle") }}</span>
        <div class="panel-actions">
          <el-tooltip effect="dark" :content="$t('detail.shareTextBtn')" placement="bottom">
            <el-button class="icon-btn" text @click="dialogFormVisible = true">
              <el-icon :size="17">
                <EditPen />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" :content="$t('detail.clearList')" placement="bottom">
            <el-button class="icon-btn danger-icon-btn" text :disabled="!textItems.length" @click="clearAllTexts">
              <el-icon :size="17">
                <Delete />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </header>
      <div class="panel-toolbar">
        <el-input v-model="textKeyword" clearable :prefix-icon="SearchIcon"
          :placeholder="$t('detail.searchTextPlaceholder')"></el-input>
        <el-dropdown trigger="click" @command="textOrder = $event">
          <el-button class="sort-btn">
            <el-icon>
              <Sort />
            </el-icon>
            &nbsp;{{ $t("detail.sortByTime") }}
            <el-icon class="sort-caret">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="desc">
                <el-icon v-if="textOrder === 'desc'">
                  <Check />
                </el-icon>
                <span v-else class="check-holder"></span>
                {{ $t("detail.sortNewest") }}
              </el-dropdown-item>
              <el-dropdown-item command="asc">
                <el-icon v-if="textOrder === 'asc'">
                  <Check />
                </el-icon>
                <span v-else class="check-holder"></span>
                {{ $t("detail.sortOldest") }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="panel-body msg-list">
        <!-- 消息流 -->
        <template v-if="filteredTexts.length">
          <div v-for="msg in filteredTexts" :key="msg.name" class="msg-card">
            <div class="msg-head">
              <span class="msg-avatar" :style="{ backgroundColor: avatarColor(msg.nickname || msg.username) }">
                {{ (msg.nickname || msg.username || "?").charAt(0) }}
              </span>
              <span class="msg-name">{{ msg.nickname || msg.username }}</span>
              <span v-if="msg.nickname && msg.username" class="msg-ip">{{ msg.username }}</span>
              <span class="msg-head-space"></span>
              <el-button class="icon-btn" text :title="$t('detail.copyTextTip')" @click="handleTextCopy(msg, $event)">
                <el-icon>
                  <CopyDocument />
                </el-icon>
              </el-button>
              <el-dropdown trigger="click" @command="(cmd) => onTextCommand(cmd, msg)">
                <el-button class="icon-btn" text :title="$t('detail.moreActions')">
                  <el-icon>
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">
                      {{ $t("detail.viewFullText") }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="danger-item">
                      {{ $t("detail.deleteText") }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="msg-bubble" :class="{ clamp: isLongText(msg) }">
              <div class="bubble-text">{{ msg.content }}</div>
            </div>
            <el-button v-if="isLongText(msg)" text type="primary" class="msg-more" @click="showFullText(msg)">
              {{ $t("detail.viewFullText") }}
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
          <div class="empty-title">
            {{ textKeyword ? $t("detail.searchNoResult") : $t("detail.noTexts") }}
          </div>
          <div v-if="!textKeyword" class="empty-tip">
            {{ $t("detail.noTextsTip") }}
          </div>
          <el-button v-else text type="primary" @click="textKeyword = ''">{{ $t("detail.clearSearch") }}</el-button>
        </div>
      </div>
      <footer class="panel-footer">
        {{ $t("detail.textCount", { count: filteredTexts.length }) }}
      </footer>
    </section>
  </main>

  <!-- 分享文本弹窗 -->
  <el-dialog v-model="dialogFormVisible" :title="$t('detail.shareText')" width="480px" append-to-body>
    <el-input v-model="form.nickname" :placeholder="$t('detail.nicknamePlaceholder')" style="margin-bottom: 8px">
    </el-input>
    <el-input type="textarea" :rows="2" :autosize="{ minRows: 2, maxRows: 4 }" :placeholder="$t('detail.inputContent')"
      v-model="form.text">
    </el-input>
    <template #footer>
      <el-button type="primary" @click="formSubmit">{{
        $t("detail.submit")
        }}</el-button>
    </template>
  </el-dialog>

  <!-- 查看全文弹窗 -->
  <el-dialog v-model="fullTextVisible" :title="$t('detail.fullTextTitle')" width="560px" append-to-body>
    <div v-if="fullTextMsg" class="fulltext-meta">
      <span class="msg-avatar" :style="{ backgroundColor: avatarColor(fullTextMsg.nickname || fullTextMsg.username) }">
        {{ (fullTextMsg.nickname || fullTextMsg.username || "?").charAt(0) }}
      </span>
      <span class="msg-name">{{ fullTextMsg.nickname || fullTextMsg.username }}</span>
      <span v-if="fullTextMsg.nickname && fullTextMsg.username" class="msg-ip">{{ fullTextMsg.username }}</span>
    </div>
    <div class="fulltext-body">{{ fullTextMsg && fullTextMsg.content }}</div>
    <template #footer>
      <el-button @click="fullTextVisible = false">{{
        $t("common.close")
        }}</el-button>
      <el-button type="primary" @click="copyFullText($event)">
        <el-icon>
          <CopyDocument />
        </el-icon>
        &nbsp;{{ $t("detail.copyFullText") }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 隐藏的文件选择器 -->
  <input ref="fileInput" type="file" multiple style="display: none" @change="onInputFiles" />
  <!-- 隐藏的文件夹选择器 -->
  <input ref="folderInput" type="file" webkitdirectory style="display: none" @change="onInputFolder" />
</div>
</template>

<script>
import Clipboard from "clipboard";
import { ElMessage, ElMessageBox } from "element-plus";
import QrcodeVue from "qrcode.vue";
import {
  ArrowDown,
  ChatDotRound,
  Check,
  Connection,
  CopyDocument,
  Delete,
  EditPen,
  Folder,
  FolderAdd,
  FolderOpened,
  Link,
  MoreFilled,
  Plus,
  Search as SearchIcon,
  Sort,
  UploadFilled,
} from "@element-plus/icons-vue";
import { store } from "@/store";
import { successMessage } from "@/utils/message";
import { t } from "@/i18n";

let api = window.api;

// 查找最近的按钮元素
const findButtonElement = (element) => {
  while (element && !element.matches("button")) {
    element = element.parentElement;
  }
  return element;
};

let copyClipboard = (text, event, tip) => {
  const target = findButtonElement(event.target);
  const clipboard = new Clipboard(target, {
    text: () => text,
  });
  clipboard.on("success", () => {
    successMessage(tip || t("detail.copyLinkSuccess"));
  });
  clipboard.onClick(event);
  clipboard.destroy();
};

// 文件类型徽标映射：{ 后缀: [徽标文字, 颜色] }
const FILE_BADGES = {
  doc: ["W", "#2f6fe4"],
  docx: ["W", "#2f6fe4"],
  xls: ["X", "#1f9d55"],
  xlsx: ["X", "#1f9d55"],
  csv: ["X", "#1f9d55"],
  ppt: ["P", "#d97706"],
  pptx: ["P", "#d97706"],
  pdf: ["PDF", "#e5484d"],
  png: ["IMG", "#8b5cf6"],
  jpg: ["IMG", "#8b5cf6"],
  jpeg: ["IMG", "#8b5cf6"],
  gif: ["IMG", "#8b5cf6"],
  webp: ["IMG", "#8b5cf6"],
  svg: ["IMG", "#8b5cf6"],
  bmp: ["IMG", "#8b5cf6"],
  zip: ["ZIP", "#f59e0b"],
  rar: ["ZIP", "#f59e0b"],
  "7z": ["ZIP", "#f59e0b"],
  tar: ["ZIP", "#f59e0b"],
  gz: ["ZIP", "#f59e0b"],
  exe: ["EXE", "#64748b"],
  dmg: ["EXE", "#64748b"],
  msi: ["EXE", "#64748b"],
  deb: ["EXE", "#64748b"],
  pkg: ["EXE", "#64748b"],
  mp4: ["MP4", "#ec4899"],
  mov: ["MP4", "#ec4899"],
  avi: ["MP4", "#ec4899"],
  mkv: ["MP4", "#ec4899"],
  mp3: ["MP3", "#14b8a6"],
  wav: ["MP3", "#14b8a6"],
  flac: ["MP3", "#14b8a6"],
  txt: ["TXT", "#0ea5e9"],
  md: ["TXT", "#0ea5e9"],
  json: ["TXT", "#0ea5e9"],
  log: ["TXT", "#0ea5e9"],
};
const DEFAULT_BADGE = ["FILE", "#7c8db5"];

// 长文本折叠阈值：超过 6 行或 200 字符时折叠
const LONG_TEXT_LINES = 6;
const LONG_TEXT_CHARS = 200;

export default {
  name: "DetailPage",
  components: {
    QrcodeVue,
    ArrowDown,
    ChatDotRound,
    Check,
    Connection,
    CopyDocument,
    Delete,
    EditPen,
    Folder,
    FolderAdd,
    FolderOpened,
    Link,
    MoreFilled,
    Plus,
    Sort,
    UploadFilled,
  },
  data: () => {
    return {
      SearchIcon,
      form: {
        text: "",
        nickname: "",
      },
      dialogFormVisible: false,
      fullTextVisible: false,
      fullTextMsg: null,
      fileKeyword: "",
      textKeyword: "",
      fileOrder: "desc",
      textOrder: "desc",
      dragCount: 0,
    };
  },
  computed: {
    settingForm() {
      return store.settingForm;
    },
    files() {
      return store.files;
    },
    ipFamily() {
      return store.ipFamily;
    },
    netInterfaceNames() {
      return store.netInterfaceNames;
    },
    currentInterfaceName() {
      return store.currentInterfaceName;
    },
    fileItems() {
      return this.files.filter((f) => f.type !== "text");
    },
    textItems() {
      return this.files.filter((f) => f.type === "text");
    },
    filteredFiles() {
      return this.sortItems(
        this.fileItems.filter((f) =>
          (f.name || "").toLowerCase().includes(this.fileKeyword.trim().toLowerCase())
        ),
        this.fileOrder
      );
    },
    filteredTexts() {
      const keyword = this.textKeyword.trim().toLowerCase();
      return this.sortItems(
        this.textItems.filter(
          (m) =>
            (m.content || "").toLowerCase().includes(keyword) ||
            (m.nickname || "").toLowerCase().includes(keyword) ||
            (m.username || "").toLowerCase().includes(keyword)
        ),
        this.textOrder
      );
    },
  },
  methods: {
    formSubmit: function () {
      let text = this.form.text;
      if (!text) {
        return;
      }
      if (this.form.nickname) {
        localStorage.setItem("fileShareNickname", this.form.nickname);
      }
      api.addText(text, this.settingForm.ip, this.form.nickname);
      store.files = api.listFiles();
      this.form.text = "";
      this.dialogFormVisible = false;
    },
    // 根据字符串 hash 生成头像背景色（按位置加权，避免相似 IP 得到相近颜色）
    avatarColor: function (str) {
      let hash = 0;
      for (let i = 0; i < (str || "").length; i++) {
        hash = (hash + str.charCodeAt(i) * (i + 1) * 16) % 360;
      }
      return `hsl(${hash}, 62%, 52%)`;
    },
    // 置顶条目始终在前，其余按时间（加入顺序）排序
    sortItems: function (items, order) {
      const pinned = items.filter((f) => f.pinned === true);
      const rest = items.filter((f) => f.pinned !== true);
      if (order === "asc") {
        return pinned.concat(rest);
      }
      return pinned.concat(rest.slice().reverse());
    },
    // 文件类型徽标
    fileBadge: function (file) {
      const name = file.name || "";
      const dot = name.lastIndexOf(".");
      const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "";
      const badge = FILE_BADGES[ext];
      return {
        label: badge ? badge[0] : DEFAULT_BADGE[0],
        color: badge ? badge[1] : DEFAULT_BADGE[1],
      };
    },
    // 长文本折叠判断
    isLongText: function (msg) {
      const content = (msg && msg.content) || "";
      return (
        content.split("\n").length > LONG_TEXT_LINES ||
        content.length > LONG_TEXT_CHARS
      );
    },
    showFullText: function (msg) {
      this.fullTextMsg = msg;
      this.fullTextVisible = true;
    },
    copyFullText: function (event) {
      if (this.fullTextMsg) {
        copyClipboard(this.fullTextMsg.content, event, t("detail.textCopied"));
      }
    },
    // 选择文件
    selectFiles: function () {
      this.$refs.fileInput.click();
    },
    // 选择文件夹
    selectFolder: function () {
      this.$refs.folderInput.click();
    },
    onInputFiles: function (e) {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => this.addFiles(file));
      e.target.value = "";
    },
    // 从 webkitdirectory 选择结果中还原所选文件夹路径
    onInputFolder: function (e) {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      if (!files.length) {
        return;
      }
      const first = files[0];
      const rel = first.webkitRelativePath || "";
      const folderName = rel ? rel.split("/")[0] : first.name;
      const folderPath = rel
        ? first.path.slice(0, first.path.length - rel.length) + folderName
        : first.path;
      this.addFiles({ name: folderName, path: folderPath });
    },
    // 拖拽添加
    onDragEnter: function () {
      this.dragCount += 1;
    },
    onDragLeave: function () {
      this.dragCount = Math.max(0, this.dragCount - 1);
    },
    onDrop: function (e) {
      this.dragCount = 0;
      const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
      files.forEach((file) => this.addFiles(file));
    },
    addFiles: function (file) {
      if (!file || !file.path) {
        ElMessage.error(t("common.operationFail"));
        return;
      }
      let target = {
        name: file.name,
        path: file.path,
        username: this.settingForm.ip,
      };
      let { success, message } = api.addFile(target);
      if (success) {
        store.files = api.listFiles();
      } else {
        ElMessage.error(message);
      }
    },
    clearAllFiles: function () {
      ElMessageBox.confirm(
        t("detail.clearFilesConfirm"),
        t("detail.clearList"),
        {
          type: "warning",
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
        }
      )
        .then(() => {
          this.fileItems.forEach((f) => {
            api.removeFile(f);
          });
          store.files = api.listFiles();
          successMessage(t("detail.listCleared"));
        })
        .catch(() => { });
    },
    clearAllTexts: function () {
      ElMessageBox.confirm(
        t("detail.clearTextsConfirm"),
        t("detail.clearList"),
        {
          type: "warning",
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
        }
      )
        .then(() => {
          this.textItems.forEach((f) => {
            api.removeFile(f);
          });
          store.files = api.listFiles();
          successMessage(t("detail.listCleared"));
        })
        .catch(() => { });
    },
    onFileCommand: function (cmd, file) {
      if (cmd === "delete") {
        this.removeFile(file);
      }
    },
    onTextCommand: function (cmd, msg) {
      if (cmd === "view") {
        this.showFullText(msg);
      } else if (cmd === "delete") {
        this.removeText(msg);
      }
    },
    removeFile: function (file) {
      ElMessageBox.confirm(
        t("detail.deleteFileConfirm"),
        t("detail.deleteFile"),
        {
          type: "warning",
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
        }
      )
        .then(() => {
          api.removeFile(file);
          store.files = api.listFiles();
          successMessage(t("common.deleteSuccess"));
        })
        .catch(() => { });
    },
    removeText: function (msg) {
      ElMessageBox.confirm(
        t("detail.deleteTextConfirm"),
        t("detail.deleteText"),
        {
          type: "warning",
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
        }
      )
        .then(() => {
          api.removeFile(msg);
          store.files = api.listFiles();
          successMessage(t("common.deleteSuccess"));
        })
        .catch(() => { });
    },
    openFile: function (file) {
      api.openFile(file.name, (err) => {
        ElMessage.error({
          message: t("detail.openFileFail", { err }),
          type: "error",
        });
      });
    },
    handleFileUrlCopy: function (file, event) {
      let url = this.getFileUrl(file);
      copyClipboard(url, event);
    },
    handleClipboard: function (data, event) {
      copyClipboard(data, event);
    },
    handleTextCopy: function (msg, event) {
      copyClipboard(msg.content, event, t("detail.textCopied"));
    },
    getFileUrl(file) {
      let url =
        this.settingForm.url +
        `/api/download?filename=${encodeURIComponent(
          file.name,
        )}&token=${api.getToken()}&timestamp=${new Date().getTime()}`;
      return url;
    },
    // 切换协议
    changeIpFamily: function () {
      store.ipFamily = store.ipFamily === "ipv4" ? "ipv6" : "ipv4";
      // 持久化保存协议选择
      api.setIpFamily(store.ipFamily);
      store.currentNetInterfaceIdx = 0;
      store.netInterfaceNames = api.getNetInterfaceNames(store.ipFamily);
      store.currentInterfaceName = store.netInterfaceNames[0] || "";
      api.setNetInterface(store.currentInterfaceName);
      store.settingForm.url = api.getUrl();
      successMessage(t("detail.switchedProtocol", { protocol: store.ipFamily }));
    },
    // 切换网卡
    onNicChange: function (name) {
      store.currentInterfaceName = name;
      store.currentNetInterfaceIdx = store.netInterfaceNames.indexOf(name);
      if (store.currentInterfaceName) {
        api.setNetInterface(store.currentInterfaceName);
      }
      store.settingForm.url = api.getUrl();
      successMessage(
        t("detail.switchedNetInterface", { name: store.currentInterfaceName })
      );
    },
  },
};
</script>

<style>
/* ===== 页面骨架 ===== */
.detail-space {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 共享服务信息区 ===== */
.info-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(31, 45, 61, 0.05);
}

.info-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.info-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2160e8;
  background: #e8effc;
}

.info-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #7a8699;
}

.info-url {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  flex-shrink: 0;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* IPv4 / IPv6 分段切换 */
.seg-toggle {
  display: flex;
  padding: 2px;
  border-radius: 8px;
  background: #eef1f7;
}

.seg-item {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #5a6b85;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

.seg-item.active {
  color: #ffffff;
  background: var(--el-color-primary);
  box-shadow: 0 1px 3px rgba(33, 96, 232, 0.35);
}

.nic-select {
  width: 190px;
}

/* ===== 双视图工作区 ===== */
.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
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

.panel-toolbar .el-input {
  flex: 1;
}

.sort-btn {
  flex-shrink: 0;
}

.sort-caret {
  margin-left: 4px;
}

.check-holder {
  display: inline-block;
  width: 1em;
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

/* ===== 拖拽覆盖层 ===== */
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(231, 240, 254, 0.92);
  border: 2px dashed var(--el-color-primary);
  border-radius: 12px;
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

.el-dropdown-menu__item.danger-item {
  color: var(--el-color-danger);
}

.el-dropdown-menu__item.danger-item:hover {
  color: var(--el-color-danger);
  background: #fdecec;
}

/* 窄屏时上下排列，仍同时展示两个面板 */
@media (max-width: 1024px) {
  .workspace {
    flex-direction: column;
  }

  .file-panel,
  .text-panel {
    flex: 1 1 50%;
  }

  .nic-select {
    width: 150px;
  }
}
</style>
