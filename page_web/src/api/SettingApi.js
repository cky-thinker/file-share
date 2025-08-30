import request from '@/utils/request'

export function getSetting() {
  return request({
    url: '/getSetting',
    method: 'get',
  })
}
