<template>
  <svg-icon :name="name"/>
</template>

<script>
  import SvgIcon from "@/components/SvgIcon";

  const typeSuffixConfig = {
    "file-text": [".txt"],
    "file-html": [".html"],
    "file-mp3": [".mp3", ".wma", ".ape", ".wav", ".cda"],
    "file-mp4": [".mp4", ".m4v", ".avi", ".flv", ".mpeg", ".mpg", ".vob"],
    "file-pdf": [".pdf"],
    "file-excel": ['.xls', '.xlsx', '.xlsm', '.xltx', '.xltm', '.xlsb', '.xlam'],
    "file-ppt": ['.ppt', '.pptx', '.pptm', '.ppsx', '.ppsm', '.potx', '.potm', '.ppam'],
    "file-word": ['.doc', '.docx', '.docm', '.dotx', '.dotm'],
    "file-zip": [".zip", ".7z"],
    "file-picture": [".png", ".jpg", ".jpeg"],
  };

  const suffixTypeConfig = new Map()
  for (let type in typeSuffixConfig) {
    let suffixes = typeSuffixConfig[type];
    suffixes.forEach((suffix) => {
      suffixTypeConfig.set(suffix, type)
    })
  }

  const unknownIcon = "file-unknown";
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
        let separatorIdx = this.filename.lastIndexOf('.');
        if (separatorIdx < 0) {
          return unknownIcon;
        }
        let suffix = this.filename.substring(separatorIdx, this.filename.length).toLowerCase();
        let type = suffixTypeConfig.get(suffix);
        return type == null ? unknownIcon : type;
      }
    },
    components: {
      SvgIcon,
    }
  };
</script>

<style>

</style>
