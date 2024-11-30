import {createApp} from 'vue'
import App from './App.vue'
// element ui
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// vue
import router from './router'
import plugins from './plugins'

const app = createApp(App)
app.use(plugins)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
