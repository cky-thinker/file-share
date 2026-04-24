import VConsole from "vconsole";
let vConsoleInstance = null;
if (!vConsoleInstance) {
  vConsoleInstance = new VConsole();
}
window.addEventListener("keydown", (e) => {
  if (e.key === "F12") {
    if (!vConsoleInstance) {
      vConsoleInstance = new VConsole();
    }
    const panel = document.querySelector(".vc-panel");
    if (panel && panel.style.display !== "none") {
      vConsoleInstance.hide();
    } else {
      vConsoleInstance.show();
    }
  }
});

import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";

const app = createApp(App);

app.use(ElementPlus);
app.mount("#app");