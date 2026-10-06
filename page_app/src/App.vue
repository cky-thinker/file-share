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
          <SettingIcon />
        </el-icon>
        设置
      </el-button>
      <el-dialog v-model="settingFormVisible" title="设置" style="width: 70%">
        <setting></setting>
        <template #footer>
          <el-button type="primary" @click="closeSettingsForm">关闭</el-button>
        </template>
      </el-dialog>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { Setting as SettingIcon } from "@element-plus/icons-vue";
import Setting from "@/components/Setting.vue";
import { store, initStore } from "@/store";

let api = window.api;

export default {
  name: "App",
  components: {
    SettingIcon,
    Setting,
  },
  data: () => {
    return {
      settingFormVisible: false,
      devTool: false,
      timer: null,
    };
  },
  methods: {
    onHandlerSetting: function () {
      console.log("--onHandlerSetting--");
      // 每次打开时从 api 重新加载配置
      store.settingForm = api.getSetting();
      this.settingFormVisible = true;
    },
    closeSettingsForm: function () {
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
