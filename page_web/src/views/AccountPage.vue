<template>
  <div class="account-page">
    <el-card class="account-card">
      <template #header>
        <div class="account-header">
          <div class="account-header-left">
            <el-button @click="goBack" plain>
              <el-icon size="16"><Back /></el-icon>
              {{ $t("accountPage.back") }}
            </el-button>
            <span class="account-header-title">{{ $t("accountPage.title") }}</span>
          </div>
          <el-button type="primary" @click="showAddForm">
            <el-icon size="16"><Plus /></el-icon>
            {{ $t("accountPage.addAccount") }}
          </el-button>
        </div>
      </template>

      <el-table :data="accounts" style="width: 100%">
        <el-table-column prop="username" :label="$t('accountPage.username')" min-width="140" />
        <el-table-column :label="$t('accountPage.admin')" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.admin" type="danger" size="small">{{ $t("accountPage.admin") }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('accountPage.permissions')" min-width="300">
          <template #default="scope">
            <el-tag v-for="perm in permissionTags(scope.row.permissions)" :key="perm" size="small" class="perm-tag">
              {{ $t("accountPage." + perm) }}
            </el-tag>
            <span v-if="permissionTags(scope.row.permissions).length === 0">{{ $t("accountPage.noPermission") }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('accountPage.operation')" width="160" align="center">
          <template #default="scope">
            <el-button size="small" @click="showEditForm(scope.row)">{{ $t("accountPage.edit") }}</el-button>
            <el-button size="small" type="danger" plain @click="handleRemove(scope.row)">{{ $t("accountPage.delete") }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="formVisible" :title="isEdit ? $t('accountPage.editAccount') : $t('accountPage.addAccount')" width="520px">
      <el-form label-width="90px">
        <el-form-item :label="$t('accountPage.username')">
          <el-input v-model="accountForm.username" />
        </el-form-item>
        <el-form-item :label="$t('accountPage.password')">
          <el-input v-model="accountForm.password" type="password" show-password
                    :placeholder="isEdit ? $t('accountPage.passwordPlaceholderKeep') : ''" />
        </el-form-item>
        <el-form-item :label="$t('accountPage.admin')">
          <el-switch v-model="accountForm.admin" />
          <span class="form-tip">{{ $t("accountPage.adminTip") }}</span>
        </el-form-item>
        <el-form-item :label="$t('accountPage.permissions')">
          <div class="perm-check-group">
            <el-checkbox v-model="accountForm.permissions.download">{{ $t("accountPage.download") }}</el-checkbox>
            <el-checkbox v-model="accountForm.permissions.uploadFile">{{ $t("accountPage.uploadFile") }}</el-checkbox>
            <el-checkbox v-model="accountForm.permissions.uploadText">{{ $t("accountPage.uploadText") }}</el-checkbox>
            <el-checkbox v-model="accountForm.permissions.createDirectory">{{ $t("accountPage.createDirectory") }}</el-checkbox>
            <el-checkbox v-model="accountForm.permissions.removeDirectory">{{ $t("accountPage.removeDirectory") }}</el-checkbox>
            <el-checkbox v-model="accountForm.permissions.removeFile">{{ $t("accountPage.removeFile") }}</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item :label="$t('accountPage.allowAccess')">
          <el-input v-model="accountForm.permissions.allowAccess" type="textarea" :rows="2"
                    :placeholder="$t('accountPage.allowAccessPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('accountPage.denyAccess')">
          <el-input v-model="accountForm.permissions.denyAccess" type="textarea" :rows="2"
                    :placeholder="$t('accountPage.denyAccessPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ $t("accountPage.cancel") }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t("accountPage.confirm") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus } from '@element-plus/icons-vue'
import { listAccounts, addAccount, updateAccount, removeAccount } from '@/api/UserApi'
import { t } from '@/i18n'

const PERMISSION_KEYS = ['download', 'uploadFile', 'uploadText', 'createDirectory', 'removeDirectory', 'removeFile']

export default {
  name: 'AccountPage',
  components: { Back, Plus },
  data() {
    return {
      accounts: [],
      formVisible: false,
      isEdit: false,
      accountForm: {
        id: '',
        username: '',
        password: '',
        admin: false,
        permissions: {
          download: true,
          uploadFile: true,
          uploadText: true,
          createDirectory: true,
          removeDirectory: true,
          removeFile: true,
          allowAccess: '',
          denyAccess: ''
        }
      }
    }
  },
  created() {
    this.loadAccounts()
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    permissionTags(permissions) {
      let perms = permissions || {}
      return PERMISSION_KEYS.filter(key => !!perms[key])
    },
    emptyAccountForm() {
      return {
        id: '',
        username: '',
        password: '',
        admin: false,
        permissions: {
          download: true,
          uploadFile: true,
          uploadText: true,
          createDirectory: true,
          removeDirectory: true,
          removeFile: true,
          allowAccess: '',
          denyAccess: ''
        }
      }
    },
    async loadAccounts() {
      try {
        let res = await listAccounts()
        this.accounts = res.data || []
      } catch (e) {
        ElMessage.error(e.message || t('common.operationFail'))
      }
    },
    showAddForm() {
      this.accountForm = this.emptyAccountForm()
      this.isEdit = false
      this.formVisible = true
    },
    showEditForm(row) {
      let perms = row.permissions || {}
      this.accountForm = {
        id: row.id,
        username: row.username,
        password: '',
        admin: row.admin === true,
        permissions: {
          download: !!perms.download,
          uploadFile: !!perms.uploadFile,
          uploadText: !!perms.uploadText,
          createDirectory: !!perms.createDirectory,
          removeDirectory: !!perms.removeDirectory,
          removeFile: !!perms.removeFile,
          allowAccess: perms.allowAccess || '',
          denyAccess: perms.denyAccess || ''
        }
      }
      this.isEdit = true
      this.formVisible = true
    },
    async submitForm() {
      try {
        if (this.isEdit) {
          let data = {...this.accountForm}
          // 密码留空表示不修改
          if (!data.password) {
            delete data.password
          }
          await updateAccount(data)
          ElMessage.success(t('accountPage.modifySuccess'))
        } else {
          await addAccount(this.accountForm)
          ElMessage.success(t('accountPage.addSuccess'))
        }
        this.formVisible = false
        this.loadAccounts()
      } catch (e) {
        ElMessage.error(e.message || t('common.operationFail'))
      }
    },
    handleRemove(row) {
      ElMessageBox.confirm(t('accountPage.deleteConfirm'), t('accountPage.note'), {
        confirmButtonText: t('accountPage.confirm'),
        cancelButtonText: t('accountPage.cancel'),
        type: 'warning'
      }).then(async () => {
        try {
          await removeAccount({id: row.id})
          ElMessage.success(t('accountPage.deleteSuccess'))
          this.loadAccounts()
        } catch (e) {
          ElMessage.error(e.message || t('accountPage.deleteFail'))
        }
      }).catch(() => {})
    }
  }
}
</script>

<style>
.account-page {
  width: 100%;
  max-width: 960px;
  margin: 24px auto;
  padding: 0 16px;
}

.account-card {
  width: 100%;
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.account-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-header-title {
  font-size: 16px;
  font-weight: 600;
}

.perm-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.perm-check-group {
  display: flex;
  flex-wrap: wrap;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
