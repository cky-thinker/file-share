<template>
  <div class="upload-file">
    <el-upload
      name="file"
      :action="uploadFileUrl"
      :file-list="fileList"
      :headers="headers"
      multiple
      :limit="limit"
      drag
      :before-upload="handleBeforeUpload"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      class="upload-file-uploader"
      ref="upload"
    >
      <!-- 上传按钮 -->
      <el-button size="mini" type="primary"
                 :style="text==='上传文件'?'background:#fff;color:#000;border:1px solid #ccc':''">{{text}}
      </el-button>
      <!-- 上传提示 -->
      <div class="el-upload__tip" slot="tip" v-if="showTip">
        请上传
        <template v-if="fileSize"> 大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b></template>
        <template v-if="fileType"> 格式为 <b style="color: #f56c6c">{{ fileType.join("/") }}</b></template>
        的文件
      </div>
    </el-upload>
  </div>
</template>

<script>
  import {getToken} from '@/utils/auth'

  export default {
    name: "FileUpload",
    props: {
      // 值
      value: [String, Object, Array],
      // 数量限制
      limit: {
        type: Number,
        default: 5,
      },
      // 大小限制(MB)
      fileSize: {
        type: Number,
        required: false
      },
      // 文件类型, 例如['png', 'jpg', 'jpeg', "doc", "xls", "ppt", "txt", "pdf"]
      fileType: {
        type: Array,
        required: false
      },
      // 是否显示提示
      isShowTip: {
        type: Boolean,
        default: false
      },
      text: {
        type: String,
        default: '选取文件'
      }
    },
    data() {
      return {
        baseUrl: "",
        uploadFileUrl: '/api/addFile', // 上传的图片服务器地址
        headers: {
          Authorization: getToken()
        },
        fileList: []
      };
    },
    watch: {
      value: {
        handler(val) {
          if (val) {
            let temp = 1;
            // 首先将值转为数组
            const list = Array.isArray(val) ? val : this.value.split(',');
            // 然后将数组转为对象数组
            this.fileList = list.map(item => {
              if (typeof item === "string") {
                item = {name: item, url: item};
              }
              item.uid = item.uid || new Date().getTime() + temp++;
              return item;
            });
          } else {
            this.fileList = [];
            return [];
          }
        },
        deep: true,
        immediate: true
      }
    },
    computed: {
      // 是否显示提示
      showTip() {
        return this.isShowTip && (this.fileType || this.fileSize);
      },
    },
    methods: {
      // 上传前校检格式和大小
      handleBeforeUpload(file) {
        // 校检文件类型
        if (this.fileType) {
          let fileExtension = "";
          if (file.name.lastIndexOf(".") > -1) {
            fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
          }
          const isTypeOk = this.fileType.some((type) => {
            if (file.type.indexOf(type) > -1) return true;
            return !!(fileExtension && fileExtension.indexOf(type) > -1);

          });
          if (!isTypeOk) {
            this.$message.error(`文件格式不正确, 请上传${this.fileType.join("/")}格式文件!`);
            return false;
          }
        }
        // 校检文件大小
        if (this.fileSize) {
          const isLt = file.size / 1024 / 1024 < this.fileSize;
          if (!isLt) {
            this.$message.error(`上传文件大小不能超过 ${this.fileSize} MB!`);
            return false;
          }
        }
        return true;
      },
      // 文件个数超出
      handleExceed() {
        this.$message.error(`上传文件数量不能超过 ${this.limit} 个!`);
      },
      // 上传失败
      handleUploadError(err) {
        console.log(err)
        this.$message.error("上传失败, 请重试");
      },
      // 上传成功回调
      handleUploadSuccess(res, file) {
        this.$message.success("上传成功");
        this.fileList.push({name: file.name, url: res.data.url});
        this.$emit("showinput", this.listToString(this.fileList));
      },
      // 删除文件
      handleDelete(index) {
        this.fileList.splice(index, 1);
        this.$emit("showinput", this.listToString(this.fileList));
      },
      // 获取文件名称
      getFileName(name) {
        if (name.lastIndexOf("/") > -1) {
          return name.slice(name.lastIndexOf("/") + 1).toLowerCase();
        } else {
          return "";
        }
      },
      // 对象转成指定字符串分隔
      listToString(list, separator) {
        let strs = "";
        separator = separator || ",";
        for (let i in list) {
          strs += list[i].url + separator;
        }
        return strs !== "" ? strs.substr(0, strs.length - 1) : "";
      },
    },
  };
</script>

<style scoped lang="scss">
  .upload-file-uploader {
    margin-bottom: 5px;
  }

  .el-upload-list__item {
    border: 1px solid #e4e7ed;
    line-height: 2;
    margin-bottom: 10px;
    position: relative;
  }

  .ele-upload-list__item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: inherit;
  }

  .ele-upload-list__item-content-action .el-link {
    margin-right: 10px;
  }
</style>
