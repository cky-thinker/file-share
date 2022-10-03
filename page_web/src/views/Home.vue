<template>
  <div class="body">
    <div class="header">
      <div class="overlay">
        <h1>File Share</h1>
        <h3>跨平台、高速的文件传输工具</h3>
      </div>
    </div>

    <el-card class="file-list">
      <div slot="header" class="clearfix">
        <span style="margin-right: 32px">分享列表</span>
        <el-button @click="fileFormVisible= true">
          <svg-icon name="发送文件" iconStyle="height: 1em; weight: 1em;"/>
          <span>上传文件</span></el-button>
        <el-button @click="showMsgForm">
          <svg-icon name="发送消息" iconStyle="height: 1em; weight: 1em;"/>
          <span>上传消息</span></el-button>
      </div>
      <div style="padding-left: 16px; padding-right: 16px">
        <el-table
          :max-height="listHeight"
          :show-header="false"
          :data="files"
          row-key="id"
        >
          <el-table-column width="50">
            <template slot-scope="scope">
              <file-icon v-if="scope.row.type === 'file'" :filename="scope.row.name"/>
              <file-icon v-if="scope.row.type === 'directory'" :is-directory="true"/>
              <svg-icon v-if="scope.row.type === 'text'" name="message"/>
            </template>
          </el-table-column>
          <el-table-column>
            <template slot-scope="scope">
              <el-tooltip class="item" effect="dark"
                          :content="scope.row.type === 'text' ? scope.row.content : scope.row.name"
                          placement="top-start">
                <div>{{scope.row.name}}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column width="70">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'file'" @click="downloadFile(scope.row.name)" icon="el-icon-download"
                         size="mini" plain></el-button>
              <el-button v-if="scope.row.type === 'text'" @click="copyMsg(scope.row.content, $event)"
                         icon="el-icon-document-copy"
                         size="mini" plain></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-dialog
      title="选取文件"
      name="file"
      customClass="dialog"
      :visible.sync="fileFormVisible">
      <div style="display: flex; justify-content: center">
        <el-upload
          drag
          action="/api/addFile"
          :on-success="uploadSuccess"
          :on-error="uploadError"
          :file-list="fileList"
          multiple>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
    </el-dialog>
    <el-dialog
      title="上传文本"
      customClass="dialog"
      :visible.sync="msgFormVisible">
      <el-form ref="form" :model="msgForm" label-width="80px">
        <el-form-item label="文本内容">
          <el-input type="textarea" :rows="5" v-model="msgForm.message"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="msgFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitMsgForm">提 交</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import FileIcon from "@/components/FileIcon";
  import SvgIcon from "@/components/SvgIcon";
  import FileUpload from "@/components/FileUpload";
  import {listFiles, uploadMsg} from "@/api/FileApi";
  import {Message} from "element-ui";
  import {copyClipboard} from '@/utils/clipboard'

  // TODO 登录校验
  // TODO 文件夹支持
  export default {
    name: 'HomeView',
    data() {
      return {
        // 文件表单
        fileFormVisible: false,
        fileForm: {},
        // 消息表单
        msgFormVisible: false,
        msgForm: {
          message: ''
        },
        // 当前文件列表
        files: [],
        path: '/',
        fileList: []
      }
    },
    mounted() {
      this.showFiles()
      // 3s更新一下列表
      setInterval(this.showFiles, 3000)
    },
    methods: {
      uploadSuccess(response, file, fileList) {
        console.log('---uploadSuccess---', response, file, fileList)
        Message({message: '上传成功', type: 'success'})
        this.fileList = fileList.filter((f) => {
          return f.name !== file.name;
        })
      },
      uploadError(err, file, fileList) {
        console.log('---uploadError---', err, file, fileList)
        Message({message: '上传失败', type: 'success'})
        this.fileList = fileList.filter((f) => {
          return f.name !== file.name;
        })
      },
      downloadFile(filename) {
        window.location.href = "/api/download?filename=" + encodeURI(filename)
      },
      copyMsg(data, event) {
        copyClipboard(data, event)
      },
      showFiles() {
        listFiles({path: this.path}).then(res => {
          this.files = res.data
        })
      },
      showMsgForm() {
        this.msgFormVisible= true
        this.msgForm = {message: ''}
      },
      submitMsgForm() {
        this.msgFormVisible = false
        uploadMsg(this.msgForm).then(res => {
          Message({message: '发送成功', type: 'success'})
          this.showFiles()
        })
      }
    },
    computed: {
      dialogWidth() {
        let width = window.innerWidth > 500 ? Math.min(window.innerWidth * 0.5, 700) : window.innerWidth * 0.95;
        return String(width);
      },
      listHeight() {
        return window.innerHeight - 260;
      }
    },
    components: {
      FileIcon, SvgIcon, FileUpload
    },
  }
</script>
<style lang="scss">
  @import '../assets/font/DancingScript.css';

  .body {
    max-width: 750px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 16px;
  }

  .header .overlay {
    width: 100%;
    margin: 0 auto;
    height: 100%;
    padding: 8px;
    color: #FFF;
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

  .button-group {
    margin-bottom: 32px;
  }

  .list-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .file-list {
    max-width: 750px;
    width: 95%;
    margin: 0 auto;
  }

  .dialog {
    max-width: 700px;
    width: 95%;
  }

  .cell {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  /** ------- pc端 --------- **/
  @media only screen and (min-width: 500px) {

  }

  /** ------- 移动端 ---------- **/
  @media only screen and (max-width: 500px) {

  }
</style>

<style>
  .el-upload-dragger .el-icon-upload {
    font-size: 46px !important;
    margin: 0 !important;
  }

  .el-upload-dragger {
    height: 90px !important;
    width: 500px !important;
    margin-bottom: 16px;
  }
</style>
