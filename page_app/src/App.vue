<template><el-config-provider :locale="elementLocale">
  <div class="body">
    <!-- 顶部应用栏 -->
    <header class="app-bar">
      <div class="app-bar-left">
        <img class="app-logo" :src="appLogo" alt="FileShare" />
        <span class="app-name">FileShare</span>
        <span class="app-bar-divider"></span>
        <span class="app-desc">{{ $t("app.desc") }}</span>
      </div>
      <div class="app-bar-right">
        <el-tooltip effect="dark" :content="$t('app.setting')" placement="bottom">
          <el-button class="bar-icon-btn" text @click="onHandlerSetting">
            <el-icon :size="18">
              <SettingIcon />
            </el-icon>
          </el-button>
        </el-tooltip>
        <span class="status-tag" :class="{ running: isRunning }">
          <span class="status-dot"></span>
          {{ isRunning ? $t("app.statusRunning") : $t("app.statusStopped") }}
        </span>
        <el-popconfirm v-if="isRunning" :title="$t('app.stopConfirm')" :confirm-button-text="$t('common.confirm')"
          :cancel-button-text="$t('common.cancel')" @confirm="stopServer">
          <template #reference>
            <el-button type="danger" plain class="stop-btn">
              <el-icon>
                <SwitchButton />
              </el-icon>
              &nbsp;{{ $t("app.stopShare") }}
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="container">
      <el-dialog v-model="settingFormVisible" :title="$t('app.setting')" style="width: 70%">
        <setting></setting>
        <template #footer>
          <el-button type="primary" @click="closeSettingsForm">{{
            $t("common.close")
          }}</el-button>
        </template>
      </el-dialog>
      <router-view></router-view>
    </main>
  </div>
</el-config-provider></template>

<script>
import { Setting as SettingIcon, SwitchButton } from "@element-plus/icons-vue";
import Setting from "@/components/Setting.vue";
import { store, initStore } from "@/store";
import { i18nState, getLocale } from "@/i18n";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import en from "element-plus/dist/locale/en.mjs";
import appLogo from "@/assets/logo.png";

let api = window.api;

export default {
  name: "App",
  components: {
    SettingIcon,
    SwitchButton,
    Setting,
  },
  data: () => {
    return {
      appLogo,
      devTool: false,
      timer: null,
    };
  },
  computed: {
    // Element Plus 组件内置文案随语言切换
    elementLocale() {
      return i18nState.locale === "zh" ? zhCn : en;
    },
    isRunning() {
      return store.serverStatus === "start";
    },
    settingFormVisible: {
      get() {
        return store.settingsVisible;
      },
      set(value) {
        store.settingsVisible = value;
      },
    },
  },
  methods: {
    onHandlerSetting: function () {
      // 每次打开时从 api 重新加载配置
      store.settingForm = api.getSetting();
      // 未保存过语言时，回显当前生效的语言
      if (!store.settingForm.language) {
        store.settingForm.language = getLocale();
      }
      store.settingsVisible = true;
    },
    closeSettingsForm: function () {
      store.settingsVisible = false;
    },
    stopServer: function () {
      api.stopServer();
    },
    // 根据服务状态在起始页与详情页之间切换
    syncRoute: function () {
      const target = store.serverStatus === "start" ? "/detail" : "/";
      if (this.$route.path !== target) {
        this.$router.replace(target);
      }
    },
  },
  mounted: function () {
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

#app {
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
  color: #1f2d3d;
  background: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 主色与圆角（现代科技蓝） */
.body {
  --el-color-primary: #2160e8;
  --el-color-primary-light-3: #4d85ee;
  --el-color-primary-light-5: #79a4f3;
  --el-color-primary-light-7: #a4c3f8;
  --el-color-primary-light-8: #bad3fa;
  --el-color-primary-light-9: #dce7fb;
  --el-color-primary-dark-2: #1a4dba;
  --el-border-radius-base: 6px;
  --el-font-size-base: 13px;
}

/* 顶部应用栏 */
.app-bar {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e8edf5;
  gap: 12px;
}

.app-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-logo {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  object-fit: contain;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.app-bar-divider {
  width: 1px;
  height: 16px;
  background: #dfe5ef;
}

.app-desc {
  font-size: 13px;
  color: #7a8699;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.bar-icon-btn {
  padding: 6px;
  color: #5a6b85;
}

.bar-icon-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 13px;
  font-size: 12px;
  color: #8a94a6;
  background: #f1f3f8;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a8b3c4;
}

.status-tag.running {
  color: #16a34a;
  background: #e8f7ee;
}

.status-tag.running .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.container {
  flex: 1;
  min-height: 0;
  width: 100%;
  margin: 0 auto;
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .app-desc {
    display: none;
  }

  .container {
    padding: 12px;
  }
}
</style>
