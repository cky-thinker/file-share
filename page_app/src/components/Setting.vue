<template>
  <el-row class="row-bg">
    <el-col :span="24">
      <el-form ref="form" :model="settingForm" label-width="80px">
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
        <el-form-item label="密码认证">
          <el-switch
            v-model="settingForm.authEnable"
            @change="updateSettingsForm"
          >
          </el-switch>
        </el-form-item>
        <el-form-item v-if="settingForm.authEnable" label="校验密码">
          <el-input
            v-model="settingForm.password"
            show-password
            @change="updateSettingsForm"
          ></el-input>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
</template>

<script>
import { store } from "@/store";
import { successMessage, errorMessage } from "@/utils/message";

let api = window.api;

export default {
  name: "Setting",
  computed: {
    settingForm() {
      return store.settingForm;
    },
  },
  methods: {
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
  },
};
</script>
