<template>
  <svg-icon :name="name" icon-style="width: 2em; height: 2em;"/>
</template>

<script>
  import SvgIcon from "@/components/SvgIcon";
  import {getFileType} from "@/utils/fileUtil";

  const directoryIcon = "file-directory";

  export default {
    name: "FileIcon",
    props: {
      filename: {type: String},
      isDirectory: {type: Boolean, required: false, default: false}
    },
    computed: {
      name: function () {
        if (this.isDirectory) {
          return directoryIcon;
        }
        return getFileType(this.filename)
      }
    },
    components: {
      SvgIcon,
    }
  };
</script>

