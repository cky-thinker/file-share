import {createRouter, createWebHistory} from 'vue-router'
import Home from '@/views/Home.vue'


const routes = [
  {
    path: '/:all(.*)',
    name: 'home',
    component: Home,
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
