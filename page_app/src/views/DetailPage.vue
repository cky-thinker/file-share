<template>
  <el-space size="large" direction="vertical">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <el-row class="row-bg" justify="space-between">
            <el-col :span="6">正在分享...</el-col>
            <el-col :span="6">
              <el-button type="danger" @click="stopServer" plain
                >取消分享</el-button
              >
            </el-col>
          </el-row>
        </div>
      </template>
      <el-row class="row-bg">
        <el-col :span="12">分享链接：{{ settingForm.url }}</el-col>
        <el-col :span="4">
          <el-popover placement="left" :width="125" trigger="hover">
            <template #reference>
              <el-button
                type="default"
                title="复制链接到剪切板"
                @click="handleClipboard(settingForm.url, $event)"
              >
                <el-icon>
                  <Link />
                </el-icon>
                &nbsp;复制链接
              </el-button>
            </template>
            <qrcode-vue :value="settingForm.url"></qrcode-vue>
          </el-popover>
        </el-col>
        <el-col v-if="netInterfaceNames.length > 1" :span="4">
          <el-tooltip effect="dark" content="切换网卡" placement="top-start">
            <el-button
              type="default"
              title="切换网卡"
              @click="changeNetInterface()"
            >
              <el-icon>
                <Sort />
              </el-icon>
              &nbsp;切换网卡
            </el-button>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-tooltip effect="dark" content="切换ip协议" placement="top-start">
            <el-button
              type="default"
              title="切换ip协议"
              @click="changeIpFamily()"
            >
              <el-icon>
                <Sort />
              </el-icon>
              &nbsp;切换{{ ipFamily === "ipv6" ? "ipv4" : "ipv6" }}
            </el-button>
          </el-tooltip>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <el-dialog v-model="dialogFormVisible" title="分享一段文本">
          <el-input
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入内容"
            v-model="form.text"
          >
          </el-input>
          <template #footer>
            <el-button type="primary" @click="formSubmit">提交</el-button>
          </template>
        </el-dialog>

        <div class="card-header">
          <el-row class="row-bg">
            <el-col :span="12">分享列表</el-col>
            <el-col :span="4">
              <el-button
                @click="dialogFormVisible = true"
                type="default"
                title="分享一段文本"
              >
                <el-icon>
                  <Message />
                </el-icon>
                &nbsp;分享文本
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-popconfirm
                @confirm="removeFileAll()"
                title="确定要清空所有文件吗？"
              >
                <template #reference>
                  <el-button type="default" title="清空列表">
                    <el-icon><Delete /></el-icon>
                    &nbsp;清空列表
                  </el-button>
                </template>
              </el-popconfirm>
            </el-col>
            <el-col :span="4"> </el-col>
          </el-row>
        </div>
      </template>

      <div class="upload-box">
        <el-upload
          ref="uploadFile"
          accept=""
          drag
          multiple
          :show-file-list="false"
          action=""
          :http-request="addFiles"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            拖拽<b>文件</b>或<b>文件夹</b>到此处或点击<em>选择文件</em>，进行分享~
          </div>
        </el-upload>
      </div>

      <div v-for="file in files" :key="file" class="text item file-item">
        <el-row class="row-bg" justify="space-between">
          <el-col :span="5">
            <el-tooltip effect="light" placement="top">
              <template #content>{{ `由【${file.username}】分享` }}</template>
              <span class="username">{{ file.username }}</span>
            </el-tooltip>
          </el-col>
          <el-col :span="13">
            <el-tooltip
              v-if="file.type === 'text'"
              effect="light"
              placement="top"
            >
              <template #content>{{ file.intro }}</template>
              <span>{{ file.name }}</span>
            </el-tooltip>
            <span v-if="['directory', 'file'].includes(file.type)">{{
              file.name
            }}</span>
          </el-col>
          <el-col :span="6">
            <!-- 复制链接 -->
            <el-popover placement="left" :width="125" trigger="hover">
              <template #reference>
                <el-button
                  :style="
                    ['directory', 'file'].includes(file.type)
                      ? ''
                      : 'visibility:hidden;'
                  "
                  type="default"
                  size="small"
                  title="复制链接到剪切板"
                  @click="handleFileUrlCopy(file, $event)"
                >
                  <el-icon><Link /></el-icon>
                </el-button>
              </template>
              <qrcode-vue :value="getFileUrl(file)"></qrcode-vue>
            </el-popover>
            <!-- 复制文本 -->
            <el-button
              v-if="['text'].includes(file.type)"
              type="default"
              size="small"
              title="复制文本到剪切板"
              @click="handleClipboard(file.content, $event)"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
            <!-- 打开文件 -->
            <el-button
              v-if="['directory', 'file'].includes(file.type)"
              type="default"
              size="small"
              title="打开文件所在目录"
              @click="openFile(file.name, $event)"
            >
              <el-icon><FolderOpened /></el-icon>
            </el-button>
            <!-- 删除 -->
            <el-button
              type="default"
              size="small"
              @click="() => removeFile(file)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-col>
        </el-row>
      </div>

      <el-alert
        v-if="files.length === 0"
        title="无"
        :closable="false"
        type="info"
        center
      >
      </el-alert>
    </el-card>
  </el-space>
</template>

<script>
import Clipboard from "clipboard";
import { ElMessage } from "element-plus";
import QrcodeVue from "qrcode.vue";
import {
  Delete,
  DocumentCopy,
  FolderOpened,
  Link,
  Message,
  Sort,
} from "@element-plus/icons-vue";
import { store } from "@/store";
import { successMessage } from "@/utils/message";

let api = window.api;

// 查找最近的按钮元素
const findButtonElement = (element) => {
  while (element && !element.matches("button")) {
    element = element.parentElement;
  }
  return element;
};

let copyClipboard = (text, event) => {
  const target = findButtonElement(event.target);
  const clipboard = new Clipboard(target, {
    text: () => text,
  });
  clipboard.on("success", () => {
    console.log("copy success", text);
    successMessage("复制链接成功");
  });
  clipboard.onClick(event);
  clipboard.destroy();
};

export default {
  name: "DetailPage",
  components: {
    QrcodeVue,
    Link,
    Sort,
    Message,
    Delete,
    DocumentCopy,
    FolderOpened,
  },
  data: () => {
    return {
      form: {
        text: "",
      },
      dialogFormVisible: false,
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
  },
  methods: {
    formSubmit: function () {
      let text = this.form.text;
      api.addText(text, this.settingForm.ip);
      store.files = api.listFiles();
      this.form.text = "";
      this.dialogFormVisible = false;
    },
    stopServer: function () {
      api.stopServer();
    },
    addFiles: function (params) {
      console.log("addFiles", params);
      let file = {
        name: params.file.name,
        path: params.file.path,
        username: this.settingForm.ip,
      };
      let { success, message } = api.addFile(file);
      if (success) {
        store.files = api.listFiles();
      } else {
        ElMessage.error(message);
      }
    },
    removeFileAll: function () {
      this.files.forEach((f) => {
        api.removeFile(f);
      });
      store.files = api.listFiles();
      successMessage("已清空列表");
    },
    removeFile: function (file) {
      let removeFiles = this.files.filter((f) => f.name === file.name);
      console.log(removeFiles);
      api.removeFile(removeFiles[0]);
      store.files = api.listFiles();
    },
    openFile: function (filename) {
      api.openFile(filename, (err) => {
        ElMessage.error({ message: `文件打开失败 "${err}"`, type: "error" });
      });
    },
    handleFileUrlCopy: function (file, event) {
      let url = this.getFileUrl(file);
      copyClipboard(url, event);
    },
    getFileUrl(file) {
      let url =
        this.settingForm.url +
        `/api/download?filename=${encodeURIComponent(
          file.name,
        )}&token=${api.getToken()}&timestamp=${new Date().getTime()}`;
      return url;
    },
    handleClipboard: function (data, event) {
      copyClipboard(data, event);
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
      successMessage(`切换协议为 "${store.ipFamily}"`);
    },
    // 切换网卡
    changeNetInterface: function () {
      if (store.currentNetInterfaceIdx > 99) {
        store.currentNetInterfaceIdx = 0;
      } else {
        store.currentNetInterfaceIdx = store.currentNetInterfaceIdx + 1;
      }
      store.currentInterfaceName =
        store.netInterfaceNames[
          store.currentNetInterfaceIdx % store.netInterfaceNames.length
        ];
      // 持久化保存网卡选择
      if (store.currentInterfaceName) {
        api.setNetInterface(store.currentInterfaceName);
      }
      store.settingForm.url = api.getUrl();
      successMessage(`切换网卡为 "${store.currentInterfaceName}"`);
    },
  },
};
</script>

<style>
.upload-box {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-upload-dragger .el-icon-upload {
  font-size: 46px !important;
  margin: 0 !important;
}

.el-upload-dragger {
  height: 90px !important;
  width: 500px !important;
  margin-bottom: 16px;
}

.file-item {
  margin-bottom: 10px;
}

.username {
  font-size: 12px;
  margin-left: 2px;
  color: #909399;
}

.box-card {
  width: 700px;
}

.el-popover.el-popper {
  min-width: 100px !important;
}
</style>
