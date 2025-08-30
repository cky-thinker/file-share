import {createRouter, createWebHistory} from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/:all(.*)',
    name: 'home',
    component: Home,
    meta: {
      requiresAuth: true,
      keepAlive: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = getToken()
  
  // 如果访问登录页面且已经有token，直接跳转到首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }
  
  // 如果页面需要认证但没有token，跳转到登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  next()
})

export default router
