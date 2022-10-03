<template>
  <svg class="svg-icon" :style="iconStyle" aria-hidden="true">
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script>
export default {
  name: "SvgIcon",
  props: {
    name: {
      // svg文件名称
      type: String,
      required: true,
    },
    iconStyle: {
      type: String,
      required: false,
      default: ''
    }
  },
};
</script>

<style scoped>
.svg-icon {
  width: 2em;
  height: 2em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  pointer-events: none;
}
</style>
