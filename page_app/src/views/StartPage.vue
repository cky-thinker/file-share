<template>
  <div class="btn-box">
    <div class="start-btn" @click="startServer">开启服务</div>
    <div class="start-btn-shadow">
      <span style="--i: 1"></span>
      <span style="--i: 2"></span>
      <span style="--i: 3"></span>
      <span style="--i: 4"></span>
      <span style="--i: 5"></span>
      <span style="--i: 6"></span>
      <span style="--i: 7"></span>
      <span style="--i: 8"></span>
      <span style="--i: 9"></span>
      <span style="--i: 10"></span>
    </div>
  </div>
</template>

<script>
import { store } from "@/store";

let api = window.api;

export default {
  name: "StartPage",
  methods: {
    startServer: function () {
      store.settingForm = api.getSetting();
      api.startServer();
    },
  },
};
</script>

<style>
.btn-box {
  width: 150px;
  height: 150px;
}

.start-btn {
  text-align: center;
  line-height: 100px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  z-index: 99;
  position: absolute;
  top: 150px;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
  background-color: #409eff;
  color: #ffffff;
}

.start-btn:hover {
  cursor: pointer;
  background-color: #66b1ff;
}

.start-btn-shadow {
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 150px;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
  z-index: 1;
}

.start-btn-shadow span {
  z-index: 1;
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #ffffff;
  border-radius: 50%;
  animation: animate 2s linear infinite;
  animation-delay: calc(0.5s * var(--i));
}

.start-btn-shadow:nth-child(2) span {
  border: none;
  background-color: #f5f5f5;
  opacity: 0.8;
}

@keyframes animate {
  0% {
    width: 50px;
    height: 50px;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}
</style>
