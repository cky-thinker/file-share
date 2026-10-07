import { reactive } from "vue";
import { getLocale, setLocale } from "@/i18n";

let api = window.api;

// 起始页与详情页共享的状态
export const store = reactive({
  serverStatus: "stop",
  files: [],
  ipFamily: "ipv4",
  netInterfaceNames: [],
  currentNetInterfaceIdx: 0,
  currentInterfaceName: "",
  settingForm: {
    autoStart: false,
    url: "",
    uploadPath: "",
    port: 5421,
  },
});

// 从 api 初始化共享状态
export const initStore = () => {
  // 加载保存的协议
  const savedIpFamily = api.getIpFamily();
  if (savedIpFamily) {
    store.ipFamily = savedIpFamily;
  }

  // 初始化网卡列表
  store.netInterfaceNames = api.getNetInterfaceNames(store.ipFamily);

  // 加载保存的网卡配置
  const savedNetInterface = api.getNetInterface();
  if (
    savedNetInterface &&
    store.netInterfaceNames.includes(savedNetInterface)
  ) {
    store.currentInterfaceName = savedNetInterface;
    store.currentNetInterfaceIdx =
      store.netInterfaceNames.indexOf(savedNetInterface);
  } else {
    store.currentInterfaceName = store.netInterfaceNames[0] || "";
    store.currentNetInterfaceIdx = 0;
  }

  store.serverStatus = api.getServerStatus();
  store.files = api.listFiles();
  store.settingForm = api.getSetting();

  // 语言：已保存的配置优先，未保存时使用系统语言作为默认语言
  if (store.settingForm.language) {
    setLocale(store.settingForm.language);
  }
  store.settingForm.language = getLocale();
};
