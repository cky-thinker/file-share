import FilePage from '@/views/FilePage.vue';
import AccountPage from '@/views/AccountPage.vue';
import Login from '@/views/Login.vue';
import { createRouter, createWebHistory } from 'vue-router';


const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/account',
    name: 'account',
    component: AccountPage
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
