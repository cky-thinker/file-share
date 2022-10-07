import Vue from "vue"
import SvgIcon from "@/components/SvgIcon"

// 全局注册SvgIcon组件
Vue.component("svg-icon", SvgIcon);
// 载入所有svg icon
const requireContext = require.context("./svg", true, /\.svg$/);
requireContext.keys().forEach(requireContext);
