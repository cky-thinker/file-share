import download from './download'

export default {
  install(Vue) {
    // 下载文件
    Vue.prototype.$download = download
  }
}
