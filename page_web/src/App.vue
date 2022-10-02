<template>
  <div id="app">
    <router-view/>
  </div>
</template>

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
  }
</style>
