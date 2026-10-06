<template>
  <div class="setting-container">
    <el-tabs v-model="activeTab" tab-position="left" class="setting-tabs">
      <!-- 通用 -->
      <el-tab-pane label="通用" name="general">
        <el-form :model="settingForm" label-width="90px" class="pane-form">
          <el-form-item label="服务自启">
            <el-switch
              v-model="settingForm.autoStart"
              @change="updateSettingsForm"
            >
            </el-switch>
          </el-form-item>
          <el-form-item label="上传路径">
            <el-input
              v-model="settingForm.uploadPath"
              @change="updateSettingsForm"
            ></el-input>
          </el-form-item>
          <el-form-item label="服务端口">
            <el-input
              v-model="settingForm.port"
              @change="updateSettingsForm"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 安全 -->
      <el-tab-pane label="安全" name="security">
        <el-form :model="settingForm" label-width="90px" class="pane-form">
          <el-form-item label="密码认证">
            <el-switch
              v-model="settingForm.authEnable"
              @change="updateSettingsForm"
            >
            </el-switch>
          </el-form-item>
        </el-form>

        <div class="account-header">
          <span class="account-title">账号管理</span>
          <el-button type="primary" size="small" @click="openAddAccount">
            <el-icon><Plus /></el-icon>
            &nbsp;添加账号
          </el-button>
        </div>
        <el-table :data="accounts" size="small" border class="account-table">
          <el-table-column prop="username" label="用户名" width="120">
          </el-table-column>
          <el-table-column label="权限">
            <template #default="{ row }">
              <el-tag v-if="row.permissions.download" size="small">下载</el-tag>
              <el-tag
                v-if="row.permissions.uploadFile"
                size="small"
                type="success"
                >上传文件</el-tag
              >
              <el-tag
                v-if="row.permissions.uploadText"
                size="small"
                type="warning"
                >上传文本</el-tag
              >
              <el-tag
                v-if="
                  !row.permissions.download &&
                  !row.permissions.uploadFile &&
                  !row.permissions.uploadText
                "
                size="small"
                type="info"
                >无</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="访问范围">
            <template #default="{ row }">
              <el-tooltip
                effect="light"
                placement="top"
                :content="`允许访问：${row.permissions.allowAccess || '全部'}`"
              >
                <el-tag size="small" type="info"
                  >允许：{{ row.permissions.allowAccess || "全部" }}</el-tag
                >
              </el-tooltip>
              <el-tooltip
                v-if="row.permissions.denyAccess"
                effect="light"
                placement="top"
                :content="`禁止访问：${row.permissions.denyAccess}`"
              >
                <el-tag size="small" type="danger"
                  >禁止：{{ row.permissions.denyAccess }}</el-tag
                >
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="openEditAccount(row)"
                >编辑</el-button
              >
              <el-popconfirm title="确定删除该账号？" @confirm="deleteAccount(row)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 帮助 -->
      <el-tab-pane label="帮助" name="help">
        <div class="help-page">
          <div class="app-info">
            <img class="app-logo" :src="appLogo" alt="File Share" />
            <div class="app-version">{{ version || "未知" }}</div>
          </div>
          <div class="link-list">
            <div class="link-item" @click="openLink(links.help)">
              <span>使用帮助</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.feedback)">
              <span>问题反馈</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.star)">
              <span>关注项目</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.changelog)">
              <span>更新日志</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.source)">
              <span>查看源码</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.license)">
              <span>查看许可</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 账号编辑弹窗 -->
    <el-dialog
      v-model="accountDialogVisible"
      :title="accountForm.id ? '编辑账号' : '添加账号'"
      width="480px"
      append-to-body
    >
      <el-form :model="accountForm" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="accountForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="accountForm.password"
            show-password
            :placeholder="accountForm.id ? '不修改请留空' : ''"
          ></el-input>
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox v-model="accountForm.permissions.download"
            >下载</el-checkbox
          >
          <el-checkbox v-model="accountForm.permissions.uploadFile"
            >上传文件</el-checkbox
          >
          <el-checkbox v-model="accountForm.permissions.uploadText"
            >上传文本</el-checkbox
          >
        </el-form-item>
        <el-form-item label="允许访问">
          <el-input
            type="textarea"
            :rows="2"
            v-model="accountForm.permissions.allowAccess"
            placeholder="路径前缀，多个以英文逗号分隔，支持 * 通配符；留空表示允许所有"
          ></el-input>
        </el-form-item>
        <el-form-item label="禁止访问">
          <el-input
            type="textarea"
            :rows="2"
            v-model="accountForm.permissions.denyAccess"
            placeholder="路径前缀，多个以英文逗号分隔，支持 * 通配符；留空表示不限制"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAccount">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { store } from "@/store";
import { successMessage, errorMessage } from "@/utils/message";
import { Plus, ArrowRight } from "@element-plus/icons-vue";
import appLogo from "@/assets/logo.png";

let api = window.api;

const REPO_URL = "https://github.com/cky-thinker/file-share";

export default {
  name: "SettingPanel",
  components: { Plus, ArrowRight },
  data() {
    return {
      activeTab: "general",
      appLogo,
      accounts: [],
      version: "",
      links: {
        help: REPO_URL,
        feedback: `${REPO_URL}/issues`,
        star: `${REPO_URL}`,
        source: REPO_URL,
        license: `${REPO_URL}/blob/master/LICENSE`,
        changelog: `${REPO_URL}/releases`,
      },
      accountDialogVisible: false,
      accountForm: this.emptyAccountForm(),
    };
  },
  computed: {
    settingForm() {
      return store.settingForm;
    },
  },
  mounted() {
    this.loadAccounts();
    this.loadVersion();
  },
  methods: {
    emptyAccountForm() {
      return {
        id: "",
        username: "",
        password: "",
        permissions: {
          download: true,
          uploadFile: true,
          uploadText: true,
          allowAccess: "",
          denyAccess: "",
        },
      };
    },
    loadAccounts() {
      this.accounts = api.listAccounts();
    },
    loadVersion() {
      Promise.resolve(api.getVersion()).then((v) => {
        this.version = v ? `v${String(v).replace(/^v/i, "")}` : "";
      });
    },
    openLink(url) {
      api.openExternal(url);
    },
    updateSettingsForm: function () {
      api
        .updateSetting(store.settingForm)
        .then(() => {
          successMessage("更新成功");
          store.settingForm = api.getSetting();
        })
        .catch(() => {
          errorMessage("更新失败");
          store.settingForm = api.getSetting();
        });
    },
    openAddAccount() {
      this.accountForm = this.emptyAccountForm();
      this.accountDialogVisible = true;
    },
    openEditAccount(row) {
      this.accountForm = {
        id: row.id,
        username: row.username,
        password: "",
        permissions: { ...row.permissions },
      };
      this.accountDialogVisible = true;
    },
    submitAccount() {
      let form = this.accountForm;
      let request = form.id
        ? api.updateAccount(form.id, {
            username: form.username,
            password: form.password || undefined,
            permissions: form.permissions,
          })
        : api.addAccount({
            username: form.username,
            password: form.password,
            permissions: form.permissions,
          });
      request
        .then(() => {
          successMessage(form.id ? "修改成功" : "添加成功");
          this.accountDialogVisible = false;
          this.loadAccounts();
        })
        .catch((e) => {
          errorMessage((e && e.message) || "操作失败");
        });
    },
    deleteAccount(row) {
      api
        .removeAccount(row.id)
        .then(() => {
          successMessage("删除成功");
          this.loadAccounts();
        })
        .catch((e) => {
          errorMessage((e && e.message) || "删除失败");
        });
    },
  },
};
</script>

<style scoped>
.setting-container {
  min-height: 420px;
}

.setting-tabs {
  min-height: 420px;
}

.pane-form {
  max-width: 520px;
  padding-top: 8px;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 720px;
  margin: 8px 0 12px;
}

.account-title {
  font-weight: 600;
}

.account-table {
  max-width: 720px;
}

.link-list {
  max-width: 520px;
}

.help-page {
  max-width: 520px;
}

.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0 24px;
}

.app-logo {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  object-fit: contain;
}

.app-version {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  color: #303133;
}

.link-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}
</style>
