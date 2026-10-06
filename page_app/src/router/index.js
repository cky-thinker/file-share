import StartPage from "@/views/StartPage.vue";
import DetailPage from "@/views/DetailPage.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "start",
    component: StartPage,
  },
  {
    path: "/detail",
    name: "detail",
    component: DetailPage,
  },
];

// 页面通过 file:// 加载，使用 hash 模式
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
