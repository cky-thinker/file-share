<template>
  <div class="min-h-screen flex items-center justify-center p-5">
    <div class="login-form w-full max-w-md bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl p-10">
      <div class="text-center mb-8">
        <div class="overlay">
          <h1>File Share</h1>
          <h3>跨平台、高速的文件传输工具</h3>
        </div>
      </div>
      
      <form class="login-form-custom" @submit.prevent="handleLogin">
        <div class="input-group">
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="15" r="1" fill="currentColor"/>
            </svg>
            <input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入访问码"
              class="custom-input"
              :class="{ 'error': passwordError }"
              @keyup.enter="handleLogin"
              @input="clearError"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
            >
              <svg v-if="showPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg v-else class="eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M10.584 10.587C10.2087 10.962 10 11.4696 10 12.0195C10 13.6569 11.3431 15 13 15C13.5304 15 14.038 14.7913 14.413 14.416" stroke="currentColor" stroke-width="2"/>
                <path d="M9.363 5.365C10.2204 5.11972 11.1082 4.99684 12 5C16.478 5 20.268 7.943 21.542 12C21.2706 12.6889 20.9394 13.3446 20.555 13.9605" stroke="currentColor" stroke-width="2"/>
                <path d="M6.073 6.073C4.46104 7.14648 3.15648 8.63593 2.458 12C3.732 16.057 7.523 19 12 19C13.9657 19 15.7899 18.4023 17.2581 17.3785" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
        </div>
        
        <button
          type="submit"
          class="login-button"
          :disabled="loading"
          @click="handleLogin"
        >
          <svg v-if="loading" class="loading-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { login } from '@/api/UserApi'
import { setToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        password: ''
      },
      loading: false,
      showPassword: false,
      passwordError: ''
    }
  },
  methods: {
    handleLogin() {
      // 表单验证
      if (!this.loginForm.password.trim()) {
        this.passwordError = '请输入访问码'
        return
      }
      
      this.loading = true
      this.passwordError = ''
      
      login(this.loginForm)
        .then((res) => {
          ElMessage({
            message: '登录成功',
            type: 'success'
          })
          setToken(res.data.Authorization)
          // 跳转到首页
          this.$router.push('/')
        })
        .catch((error) => {
          console.error('登录失败:', error)
          this.passwordError = '登录失败，请检查访问码'
          ElMessage({
            message: '登录失败，请检查密码',
            type: 'error'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
      const input = this.$el.querySelector('.custom-input')
      input.type = this.showPassword ? 'text' : 'password'
    },
    
    clearError() {
      this.passwordError = ''
    }
  }
}
</script>

<style scoped>
.login-form-custom {
  width: 100%;
}

.input-group {
  margin-bottom: 24px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #6b7280;
  z-index: 1;
}

.custom-input {
  width: 100%;
  height: 52px;
  padding: 0 50px 0 50px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  outline: none;
  color: #1f2937;
}

.custom-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.custom-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.custom-input::placeholder {
  color: #9ca3af;
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.eye-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.error-message {
  margin-top: 8px;
  font-size: 14px;
  color: #ef4444;
  padding-left: 4px;
}

.login-button {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-form {
  background-color: rgba(255, 255, 255, 0.6);
}

h1 {
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

h3 {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
}

.overlay {
  margin-bottom: 32px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .custom-input,
  .login-button {
    height: 48px;
  }
  
  h1 {
    font-size: 1.75rem;
  }
  
  h3 {
    font-size: 0.9rem;
  }
}
</style>