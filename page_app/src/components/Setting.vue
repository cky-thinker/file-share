<template>
  <div class="setting-container">
    <el-tabs v-model="activeTab" tab-position="left" class="setting-tabs">
      <!-- 通用 -->
      <el-tab-pane :label="$t('setting.general')" name="general">
        <el-form :model="settingForm" label-width="90px" class="pane-form">
          <el-form-item :label="$t('setting.autoStart')">
            <el-switch
              v-model="settingForm.autoStart"
              @change="updateSettingsForm"
            >
            </el-switch>
          </el-form-item>
          <el-form-item :label="$t('setting.uploadPath')">
            <el-input
              v-model="settingForm.uploadPath"
              @change="updateSettingsForm"
            ></el-input>
          </el-form-item>
          <el-form-item :label="$t('setting.port')">
            <el-input
              v-model="settingForm.port"
              @change="updateSettingsForm"
            ></el-input>
          </el-form-item>
          <el-form-item :label="$t('setting.language')">
            <el-select
              v-model="settingForm.language"
              @change="onLanguageChange"
            >
              <el-option label="简体中文" value="zh"></el-option>
              <el-option label="English" value="en"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 安全 -->
      <el-tab-pane :label="$t('setting.security')" name="security">
        <el-form :model="settingForm" label-width="90px" class="pane-form">
          <el-form-item :label="$t('setting.authEnable')">
            <el-switch
              v-model="settingForm.authEnable"
              @change="updateSettingsForm"
            >
            </el-switch>
          </el-form-item>
        </el-form>

        <div class="account-header">
          <span class="account-title">{{ $t("setting.accountManage") }}</span>
          <el-button type="primary" size="small" @click="openAddAccount">
            <el-icon><Plus /></el-icon>
            &nbsp;{{ $t("setting.addAccount") }}
          </el-button>
        </div>
        <el-table :data="accounts" size="small" border class="account-table">
          <el-table-column
            prop="username"
            :label="$t('setting.username')"
            width="120"
          >
          </el-table-column>
          <el-table-column :label="$t('setting.permission')">
            <template #default="{ row }">
              <el-tag v-if="row.permissions.download" size="small">{{
                $t("setting.download")
              }}</el-tag>
              <el-tag
                v-if="row.permissions.uploadFile"
                size="small"
                type="success"
                >{{ $t("setting.uploadFile") }}</el-tag
              >
              <el-tag
                v-if="row.permissions.uploadText"
                size="small"
                type="warning"
                >{{ $t("setting.uploadText") }}</el-tag
              >
              <el-tag
                v-if="
                  !row.permissions.download &&
                  !row.permissions.uploadFile &&
                  !row.permissions.uploadText
                "
                size="small"
                type="info"
                >{{ $t("common.none") }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column :label="$t('setting.accessScope')">
            <template #default="{ row }">
              <el-tooltip
                effect="light"
                placement="top"
                :content="
                  $t('setting.allowTooltip', {
                    value: row.permissions.allowAccess || $t('setting.all'),
                  })
                "
              >
                <el-tag size="small" type="info">{{
                  $t("setting.allowLabel", {
                    value: row.permissions.allowAccess || $t("setting.all"),
                  })
                }}</el-tag>
              </el-tooltip>
              <el-tooltip
                v-if="row.permissions.denyAccess"
                effect="light"
                placement="top"
                :content="
                  $t('setting.denyTooltip', {
                    value: row.permissions.denyAccess,
                  })
                "
              >
                <el-tag size="small" type="danger">{{
                  $t("setting.denyLabel", {
                    value: row.permissions.denyAccess,
                  })
                }}</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column :label="$t('setting.operation')" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="openEditAccount(row)">{{
                $t("common.edit")
              }}</el-button>
              <el-popconfirm
                :title="$t('setting.deleteConfirm')"
                @confirm="deleteAccount(row)"
              >
                <template #reference>
                  <el-button size="small" type="danger">{{
                    $t("common.delete")
                  }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 帮助 -->
      <el-tab-pane :label="$t('setting.help')" name="help">
        <div class="help-page">
          <div class="app-info">
            <img class="app-logo" :src="appLogo" alt="File Share" />
            <div class="app-version">{{ version || $t("common.unknown") }}</div>
          </div>
          <div class="link-list">
            <div class="link-item" @click="openLink(links.help)">
              <span>{{ $t("setting.helpUse") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.feedback)">
              <span>{{ $t("setting.feedback") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.star)">
              <span>{{ $t("setting.star") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.changelog)">
              <span>{{ $t("setting.changelog") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.source)">
              <span>{{ $t("setting.source") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="link-item" @click="openLink(links.license)">
              <span>{{ $t("setting.license") }}</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 账号编辑弹窗 -->
    <el-dialog
      v-model="accountDialogVisible"
      :title="accountForm.id ? $t('setting.editAccount') : $t('setting.addAccount')"
      width="480px"
      append-to-body
    >
      <el-form :model="accountForm" label-width="90px">
        <el-form-item :label="$t('setting.username')">
          <el-input v-model="accountForm.username"></el-input>
        </el-form-item>
        <el-form-item :label="$t('setting.password')">
          <el-input
            v-model="accountForm.password"
            show-password
            :placeholder="
              accountForm.id ? $t('setting.passwordPlaceholderKeep') : ''
            "
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('setting.permission')">
          <el-checkbox v-model="accountForm.permissions.download">{{
            $t("setting.download")
          }}</el-checkbox>
          <el-checkbox v-model="accountForm.permissions.uploadFile">{{
            $t("setting.uploadFile")
          }}</el-checkbox>
          <el-checkbox v-model="accountForm.permissions.uploadText">{{
            $t("setting.uploadText")
          }}</el-checkbox>
        </el-form-item>
        <el-form-item :label="$t('setting.allowAccess')">
          <el-input
            type="textarea"
            :rows="2"
            v-model="accountForm.permissions.allowAccess"
            :placeholder="$t('setting.allowAccessPlaceholder')"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('setting.denyAccess')">
          <el-input
            type="textarea"
            :rows="2"
            v-model="accountForm.permissions.denyAccess"
            :placeholder="$t('setting.denyAccessPlaceholder')"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">{{
          $t("common.cancel")
        }}</el-button>
        <el-button type="primary" @click="submitAccount">{{
          $t("common.confirm")
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { store } from "@/store";
import { successMessage, errorMessage } from "@/utils/message";
import { Plus, ArrowRight } from "@element-plus/icons-vue";
import appLogo from "@/assets/logo.png";
import { setLocale } from "@/i18n";

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
          successMessage(this.$t("common.updateSuccess"));
          store.settingForm = api.getSetting();
        })
        .catch(() => {
          errorMessage(this.$t("common.updateFail"));
          store.settingForm = api.getSetting();
        });
    },
    // 切换语言：立即生效并持久化
    onLanguageChange(value) {
      setLocale(value);
      this.updateSettingsForm();
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
          successMessage(
            this.$t(form.id ? "setting.modifySuccess" : "setting.addSuccess")
          );
          this.accountDialogVisible = false;
          this.loadAccounts();
        })
        .catch((e) => {
          errorMessage((e && e.message) || this.$t("common.operationFail"));
        });
    },
    deleteAccount(row) {
      api
        .removeAccount(row.id)
        .then(() => {
          successMessage(this.$t("common.deleteSuccess"));
          this.loadAccounts();
        })
        .catch((e) => {
          errorMessage((e && e.message) || this.$t("common.deleteFail"));
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
