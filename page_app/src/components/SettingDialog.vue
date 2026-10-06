<template>
  <el-dialog v-model="visible" title="设置" style="width: 70%">
    <el-row class="row-bg">
      <el-col :span="24">
        <el-form ref="form" :model="settingForm" label-width="80px">
          <el-form-item label="服务自启">
            <el-switch v-model="settingForm.autoStart"> </el-switch>
          </el-form-item>
          <el-form-item label="上传路径">
            <el-input v-model="settingForm.uploadPath"></el-input>
          </el-form-item>
          <el-form-item label="服务端口">
            <el-input v-model="settingForm.port"></el-input>
          </el-form-item>
          <el-form-item label="密码认证">
            <el-switch v-model="settingForm.authEnable"> </el-switch>
          </el-form-item>
          <el-form-item v-if="settingForm.authEnable" label="校验密码">
            <el-input
              v-model="settingForm.password"
              show-password
            ></el-input>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <template #footer>
      <el-button type="primary" @click="updateSettingsForm">更新</el-button>
      <el-button type="primary" @click="closeSettingsForm">取消</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { store } from "@/store";
import { successMessage, errorMessage } from "@/utils/message";

let api = window.api;

export default {
  name: "SettingDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    settingForm() {
      return store.settingForm;
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        // 每次打开时从 api 重新加载配置
        store.settingForm = api.getSetting();
      }
    },
  },
  methods: {
    updateSettingsForm: function () {
      api
        .updateSetting(store.settingForm)
        .then(() => {
          successMessage("更新成功");
          store.settingForm = api.getSetting();
          this.visible = false;
        })
        .catch(() => {
          errorMessage("更新失败");
          store.settingForm = api.getSetting();
          this.visible = false;
        });
    },
    closeSettingsForm: function () {
      store.settingForm = api.getSetting();
      this.visible = false;
    },
  },
};
</script>
