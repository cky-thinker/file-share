const TokenKey = 'Authorization'
const authInvalidCallback = []

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
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
