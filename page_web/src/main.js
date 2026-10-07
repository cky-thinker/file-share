import {createApp} from 'vue'
import App from './App.vue'
// element ui
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/tailwind.css'
// vue
import router from './router'
import plugins from './plugins'
import i18n from './i18n'

const app = createApp(App)
app.use(i18n)
app.use(plugins)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
