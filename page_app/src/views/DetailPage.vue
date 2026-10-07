<template>
  <el-space
    class="detail-space"
    size="large"
    direction="vertical"
    alignment="center"
  >
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <el-row class="row-bg" justify="space-between">
            <el-col :span="6">{{ $t("detail.sharing") }}</el-col>
            <el-col :span="6">
              <el-button type="danger" @click="stopServer" plain
                >{{ $t("detail.stopShare") }}</el-button
              >
            </el-col>
          </el-row>
        </div>
      </template>
      <el-row class="row-bg">
        <el-col :span="12" class="share-url">
          <el-tooltip effect="light" placement="top" :content="settingForm.url">
            <span class="url-text"
              >{{ $t("detail.shareLink") }}{{ settingForm.url }}</span
            >
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-popover placement="left" :width="125" trigger="hover">
            <template #reference>
              <el-button
                type="default"
                :title="$t('detail.copyLinkTip')"
                @click="handleClipboard(settingForm.url, $event)"
              >
                <el-icon>
                  <Link />
                </el-icon>
                &nbsp;{{ $t("detail.copyLink") }}
              </el-button>
            </template>
            <qrcode-vue :value="settingForm.url"></qrcode-vue>
          </el-popover>
        </el-col>
        <el-col :span="4">
          <el-tooltip
            effect="dark"
            :content="$t('detail.switchIpProtocol')"
            placement="top-start"
          >
            <el-button
              type="default"
              :title="$t('detail.switchIpProtocol')"
              @click="changeIpFamily()"
            >
              <el-icon>
                <Sort />
              </el-icon>
              &nbsp;{{ $t("detail.switchTo")
              }}{{ ipFamily === "ipv6" ? "ipv4" : "ipv6" }}
            </el-button>
          </el-tooltip>
        </el-col>
        <el-col v-if="netInterfaceNames.length > 1" :span="4">
          <el-tooltip
            effect="dark"
            :content="$t('detail.switchNetInterface')"
            placement="top-start"
          >
            <el-button
              type="default"
              :title="$t('detail.switchNetInterface')"
              @click="changeNetInterface()"
            >
              <el-icon>
                <Sort />
              </el-icon>
              &nbsp;{{ $t("detail.switchNetInterface") }}
            </el-button>
          </el-tooltip>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <el-dialog
          v-model="dialogFormVisible"
          :title="$t('detail.shareText')"
        >
          <el-input
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="$t('detail.inputContent')"
            v-model="form.text"
          >
          </el-input>
          <template #footer>
            <el-button type="primary" @click="formSubmit">{{
              $t("detail.submit")
            }}</el-button>
          </template>
        </el-dialog>

        <div class="card-header">
          <el-row class="row-bg">
            <el-col :span="12">{{ $t("detail.shareList") }}</el-col>
            <el-col :span="4">
              <el-button
                @click="dialogFormVisible = true"
                type="default"
                :title="$t('detail.shareText')"
              >
                <el-icon>
                  <Message />
                </el-icon>
                &nbsp;{{ $t("detail.shareTextBtn") }}
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-popconfirm
                @confirm="removeFileAll()"
                :title="$t('detail.clearListConfirm')"
              >
                <template #reference>
                  <el-button type="default" :title="$t('detail.clearList')">
                    <el-icon><Delete /></el-icon>
                    &nbsp;{{ $t("detail.clearList") }}
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
          <div
            class="el-upload__text"
            v-html="$t('detail.uploadDragText')"
          ></div>
        </el-upload>
      </div>

      <div v-for="file in files" :key="file" class="text item file-item">
        <el-row class="row-bg" justify="space-between">
          <el-col :span="5">
            <el-tooltip effect="light" placement="top">
              <template #content>{{
                $t("detail.sharedBy", { name: file.username })
              }}</template>
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
                  :title="$t('detail.copyLinkTip')"
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
              :title="$t('detail.copyTextTip')"
              @click="handleClipboard(file.content, $event)"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
            <!-- 打开文件 -->
            <el-button
              v-if="['directory', 'file'].includes(file.type)"
              type="default"
              size="small"
              :title="$t('detail.openFileDir')"
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
        :title="$t('common.none')"
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
import { t } from "@/i18n";

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
    successMessage(t("detail.copyLinkSuccess"));
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
      successMessage(t("detail.listCleared"));
    },
    removeFile: function (file) {
      let removeFiles = this.files.filter((f) => f.name === file.name);
      console.log(removeFiles);
      api.removeFile(removeFiles[0]);
      store.files = api.listFiles();
    },
    openFile: function (filename) {
      api.openFile(filename, (err) => {
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
      successMessage(t("detail.switchedProtocol", { protocol: store.ipFamily }));
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
      successMessage(
        t("detail.switchedNetInterface", { name: store.currentInterfaceName })
      );
    },
  },
};
</script>

<style>
.share-url {
  overflow: hidden;
}

.url-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-space {
  display: flex;
  justify-content: center;
}

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
