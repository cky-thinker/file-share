import SvgIcon from "@/components/SvgIcon/index.vue";
import FileIcon from "@/components/FileIcon/index.vue";


export function registryIcon(app) {
  // 全局注册SvgIcon组件
  app.component("svg-icon", SvgIcon);
  // 载入所有svg icon
  const requireContext = require.context("../assets/icons/svg", true, /\.svg$/);
  requireContext.keys().forEach(requireContext);
  // 全局注册FileIcon组件
  app.component("file-icon", FileIcon);
}
