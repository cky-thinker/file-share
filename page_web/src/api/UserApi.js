import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data: data
  })
}

// 账号列表（仅管理员）
export function listAccounts() {
  return request({
    url: '/accounts',
    method: 'get',
  })
}

// 添加账号（仅管理员）
export function addAccount(data) {
  return request({
    url: '/addAccount',
    method: 'post',
    data: data
  })
}

// 修改账号（仅管理员）
export function updateAccount(data) {
  return request({
    url: '/updateAccount',
    method: 'post',
    data: data
  })
}

// 删除账号（仅管理员）
export function removeAccount(data) {
  return request({
    url: '/removeAccount',
    method: 'post',
    data: data
  })
}
