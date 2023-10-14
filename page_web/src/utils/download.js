import {saveAs} from 'file-saver'
import axios from 'axios'
import {getToken} from '@/utils/auth'
import {Loading, Message} from 'element-ui'

let downloadLoading;

function saveFile(text, name, opts) {
  saveAs(text, name, opts)
}

export function download(filename) {
  downloadLoading = Loading.service({
    text: '正在下载数据，请稍候',
    spinner: 'el-icon-loading',
    background: 'rgba(0,0,0,0.7)'
  })
  let url = `/api/download?filename=${encodeURIComponent(filename)}&token=${getToken()}`
  axios({
    method: 'get',
    url: url,
    responseType: 'blob'
  }).then(async (res) => {
    if (res.status === 200) {
      const blob = new Blob([res.data])
      saveFile(blob, decodeURI(res.headers['download-filename']))
    } else {
      console.log(res)
      Message({message: '下载失败', type: 'error'})
    }
    downloadLoading.close()
  }).catch(error => {
    console.log(error)
    Message({message: '下载失败', type: 'error'})
    downloadLoading.close()
  })
}
