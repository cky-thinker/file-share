import request from '@/utils/request'

//
export function listFiles(query) {
  return request({
    url: '/files',
    method: 'get',
    params: query
  })
  // return new Promise(function (resolve, reject) {
  //   return resolve({
  //     data: [
  //       {id: 1, name: '文件夹', type: 'directory', hasChildren: true},
  //       {id: 2, name: 'test.txt', type: 'file'},
  //       {id: 3, name: 'test.doc', type: 'file'},
  //       {id: 4, name: 'test.ppt', type: 'file'},
  //       {id: 5, name: 'test.ppt', type: 'file'},
  //       {id: 6, name: 'fasdfasdfasdfasfassdfa', type: 'text', content: 'fasdfasdfasdfasfassdfa'}
  //     ]
  //   })
  // })
}

export function uploadMsg(data) {
  return request({
    url: '/addText',
    method: 'post',
    data: data
  })
}

// 文本列表（聊天视图）
export function listTexts() {
  return request({
    url: '/texts',
    method: 'get',
  })
}

// 新建文件夹
export function createDirectory(data) {
  return request({
    url: '/createDirectory',
    method: 'post',
    data: data
  })
}

// 删除文件
export function removeFile(data) {
  return request({
    url: '/removeFile',
    method: 'post',
    data: data
  })
}

// 删除文件夹
export function removeDirectory(data) {
  return request({
    url: '/removeDirectory',
    method: 'post',
    data: data
  })
}

// 自定义排序：置顶/取消置顶/上移/下移
export function sortFile(data) {
  return request({
    url: '/sortFile',
    method: 'post',
    data: data
  })
}

/**
 * @returns { import('axios').AxiosPromise<{enable:boolean,chunkSize:number}>}
 */
export function getTusConfig() {
  return request({
    url: '/tusConfig',
    method: 'get',
  })
}
