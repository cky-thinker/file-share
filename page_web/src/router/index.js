import FilePage from '@/views/FilePage.vue';
import Login from '@/views/Login.vue';
import { createRouter, createWebHistory } from 'vue-router';


const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/:all(.*)',
    name: 'file',
    component: FilePage,
    meta: {
      keepAlive: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
