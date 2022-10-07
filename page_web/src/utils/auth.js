import Cookies from 'js-cookie'
export const TokenKey = 'Authorization'
const authInvalidCallback = []

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function addAuthInvalidCallback(callback) {
  authInvalidCallback.push(callback)
}

export function logout() {
  removeToken()
  for (let callback of authInvalidCallback) {
    callback()
  }
}
