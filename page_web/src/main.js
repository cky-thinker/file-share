import Vue from "vue"
import Element from 'element-ui'
import './assets/styles/element-variables.scss'
import '@/assets/styles/index.scss' // global css
import '@/assets/styles/common.scss' // common css

import App from "./App.vue"
import plugins from './plugins' // plugins

import './assets/icons' // svg icon

// 通用组件
import FileIcon from "@/components/FileIcon"

import router from './router'

Vue.component("file-icon", FileIcon);

Vue.use(plugins)
Vue.use(Element)

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App)
}).$mount("#app");
