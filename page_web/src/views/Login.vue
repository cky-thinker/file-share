<template>
  <div class="min-h-screen flex items-center justify-center p-5">
    <div class="login-form w-full max-w-md bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl p-10">
      <div class="text-center mb-8">
        <div class="overlay">
          <h1>File Share</h1>
          <h3>跨平台、高速的文件传输工具</h3>
        </div>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="w-full"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="password" class="mb-5">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入访问码"
            size="large"
            show-password
            prefix-icon="Lock"
            class="h-11"
          />
        </el-form-item>
        
        <el-form-item class="mb-0">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="w-full h-11 text-base font-medium"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
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
      loginRules: {
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          try {
            const res = await login(this.loginForm)
            ElMessage({
              message: '登录成功',
              type: 'success'
            })
            setToken(res.data.Authorization)
            // 跳转到首页
            this.$router.push('/')
          } catch (error) {
            console.error('登录失败:', error)
            ElMessage({
              message: '登录失败，请检查密码',
              type: 'error'
            })
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
:deep(.el-input__wrapper) {
  height: 44px;
}
.login-form {
  background-color: rgba(255, 255, 255, 0.6);
}

h1 {
  color: var(--el-text-color-primary);
}

h3 {
  color: var(--el-text-color-primary);
}
</style>