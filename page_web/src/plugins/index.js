import download from './download'
import {createTusClient} from './tusClient'

export default {
  install(Vue) {
    // 下载文件
    Vue.prototype.$download = download
    // tus文件上传客户端
    Vue.prototype.$createTusClient = createTusClient
  }
}
