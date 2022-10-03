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
