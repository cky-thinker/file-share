<template>
  <div class="body">
    <div class="container">
      <el-button
        class="setting-btn"
        @click="onHandlerSetting()"
        type="default"
        title="设置"
      >
        <el-icon>
          <Setting />
        </el-icon>
        设置
      </el-button>
      <el-dialog v-model="settingFormVisible" title="设置" style="width: 70%">
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
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { Setting } from "@element-plus/icons-vue";
import { store, initStore } from "@/store";
import { successMessage, errorMessage } from "@/utils/message";

let api = window.api;

export default {
  name: "App",
  components: {
    Setting,
  },
  data: () => {
    return {
      settingFormVisible: false,
      devTool: false,
      timer: null,
    };
  },
  computed: {
    settingForm() {
      return store.settingForm;
    },
  },
  methods: {
    onHandlerSetting: function () {
      console.log("--onHandlerSetting--");
      store.settingForm = api.getSetting();
      this.settingFormVisible = true;
    },
    updateSettingsForm: function () {
      console.log(store.settingForm);
      api
        .updateSetting(store.settingForm)
        .then(() => {
          successMessage("更新成功");
          store.settingForm = api.getSetting();
          this.settingFormVisible = false;
        })
        .catch(() => {
          errorMessage("更新失败");
          store.settingForm = api.getSetting();
          this.settingFormVisible = false;
        });
    },
    closeSettingsForm: function () {
      store.settingForm = api.getSetting();
      this.settingFormVisible = false;
    },
    // 根据服务状态在起始页与详情页之间切换
    syncRoute: function () {
      const target = store.serverStatus === "start" ? "/detail" : "/";
      if (this.$route.path !== target) {
        this.$router.replace(target);
      }
    },
    getPlatform() {
      return api.getPlatform();
    },
    switchDevTool() {
      console.log("---switchDevTool--", this.devTool);
      if (this.devTool) {
        api.openDevTool();
      } else {
        api.closeDevTool();
      }
    },
  },
  mounted: function () {
    console.log(api);
    initStore();
    this.syncRoute();
    // 注册事件监听
    api.registryEventListener("server.statusChange", (event) => {
      console.log("---服务状态变更---", event);
      store.serverStatus = event.data.status;
      this.syncRoute();
    });
    api.registryEventListener("fileDb.listChange", (event) => {
      console.log("---文件列表变更---", event);
      store.files = api.listFiles();
      console.log(store.files);
    });
  },
  beforeUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  },
};
</script>

<style>
html {
  height: 100%;
}

body {
  margin: 0;
  height: 100%;
}

*::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.body {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  background-blend-mode: screen, overlay, hard-light, color-burn, color-dodge,
    normal;
  background-attachment: fixed;
  background-repeat: no-repeat;
  min-height: 600px;
  position: absolute;
  background-size: 100% 100%;
  width: 100%;
  height: 100%;
  overflow: scroll;
}

.container {
  max-width: 750px;
  margin: 0 auto;
  padding-top: 56px;
}

.setting-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.row-bg {
  align-items: center;
}
</style>
