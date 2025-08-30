<template>
  <el-config-provider :locale="locale">
    <router-view/>
  </el-config-provider>
</template>

<script setup>
import {computed, ref} from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

const language = ref('zh-cn')
const locale = computed(() => (language.value === 'zh-cn' ? zhCn : en))
</script>


<style>
body {
  margin: 0;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  line-height: 1.7;
  background-image: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
  background-blend-mode: screen, overlay, hard-light, color-burn, color-dodge, normal;
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-position: 0 100%;
  color: #ffffff;
  width: 100vw;
  height: 100vh;
}

h1 {
  font-family: 'DancingScript', cursive;
  font-size: 60px;
  margin-bottom: 15px;
  margin-top: 8px;
}

h3 {
  font-family: 'Open Sans', sans-serif;
  margin-bottom: 30px;
  display: block;
  font-size: 1em;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0;
  margin-inline-end: 0;
  font-weight: bold;
}
</style>
