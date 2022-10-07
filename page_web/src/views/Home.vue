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
        <el-row class="row-bg">
          <el-col :span="12">分享列表</el-col>
          <el-col :span="6">
            <el-button @click="fileFormVisible= true" size="mini">
              <svg-icon name="发送文件" iconStyle="height: 1em; weight: 1em;"/>
              {{isPC ? "上传文件" : ""}}
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showMsgForm" type="default" size="mini" title="分享一段文本">
              <svg-icon name="发送消息" iconStyle="height: 1em; weight: 1em;"/>
              {{isPC ?  "上传文本" : ""}}
            </el-button>
          </el-col>
        </el-row>
      </div>
      <div style="padding-left: 16px; padding-right: 16px; margin-bottom: 8px;">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>
            <el-link :underline="false" @click="skipPath(0)">
              首页
            </el-link>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-for="(p, idx) in path">
            <el-link :underline="false" @click="skipPath(idx + 1)">
              {{p}}
            </el-link>
          </el-breadcrumb-item>
        </el-breadcrumb>
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
              <div class="pointer" @click="handleItemClick(scope.row, $event)">
                <file-icon v-if="scope.row.type === 'file'" :filename="scope.row.name"/>
                <file-icon v-if="scope.row.type === 'directory'" :is-directory="true"/>
                <svg-icon v-if="scope.row.type === 'text'" name="message"/>
              </div>
            </template>
          </el-table-column>
          <el-table-column class-name="pointer" @click="handleItemClick(scope.row, $event)">
            <template slot-scope="scope">
              <div class="pointer" @click="handleItemClick(scope.row, $event)">
                <el-tooltip class="item" effect="dark"
                            :content="scope.row.type === 'text' ? scope.row.content : scope.row.name"
                            placement="right">
                  <div>{{scope.row.name}}</div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column width="70">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'directory'" @click="handleItemClick(scope.row, $event)"
                         icon="el-icon-search"
                         size="mini" plain></el-button>
              <el-button v-if="scope.row.type === 'file'" @click="handleItemClick(scope.row, $event)"
                         icon="el-icon-download"
                         size="mini" plain></el-button>
              <el-button v-if="scope.row.type === 'text'" @click="handleItemClick(scope.row, $event)"
                         icon="el-icon-document-copy"
                         size="mini" plain></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-dialog
      title="分享文件"
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
          :headers="headers"
          multiple>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
    </el-dialog>
    <el-dialog
      title="分享文本"
      customClass="dialog"
      :visible.sync="msgFormVisible">
      <el-form ref="form" :model="msgForm" label-width="80px" @key.enter.native="submitMsgForm">
        <el-form-item label="文本内容">
          <el-input type="textarea" :rows="5" v-model="msgForm.message"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitMsgForm">提 交</el-button>
        <el-button @click="msgFormVisible = false">取 消</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="身份校验"
      customClass="dialog"
      :visible.sync="loginFormVisible">
      <el-form ref="loginForm" :model="loginForm" label-width="80px" @submit.native.prevent="submitLoginForm">
        <el-form-item label="密码">
          <el-input v-model="loginForm.password"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitLoginForm">提 交</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import FileIcon from "@/components/FileIcon";
  import SvgIcon from "@/components/SvgIcon";
  import FileUpload from "@/components/FileUpload";
  import {listFiles, uploadMsg} from "@/api/FileApi";
  import {login} from "@/api/UserApi";
  import {addAuthInvalidCallback, getToken, setToken} from "@/utils/auth";
  import {Message} from "element-ui";
  import {copyClipboard} from '@/utils/clipboard'

  export default {
    name: 'HomeView',
    data() {
      return {
        // 文件表单
        fileFormVisible: false,
        fileForm: {},
        fileList: [],
        // 消息表单
        msgFormVisible: false,
        msgForm: {
          message: ''
        },
        // 登录表单
        loginFormVisible: false,
        loginForm: {
          password: ''
        },
        // 共享文件列表
        path: [],
        files: [],
        headers: {
          Authorization: ''
        }
      }
    },
    mounted() {
      this.showFiles()
      // 3s更新一下列表
      setInterval(this.showFiles, 3000)
      addAuthInvalidCallback(() => {
        this.loginFormVisible = true;
      })
      // 更新请求头内容
      this.updateHeaders()
    },
    methods: {
      handleItemClick(item, event) {
        if (item.type === 'directory') {
          this.openDirectory(item.name)
        } else if (item.type === 'file') {
          this.downloadFile(item.name)
        } else if (item.type === 'text') {
          this.copyMsg(item.content, event)
        }
      },
      openDirectory(name) {
        this.path.push(name)
        this.showFiles()
      },
      skipPath(idx) {
        this.path = this.path.slice(0, idx);
        this.showFiles()
      },
      showFiles() {
        listFiles({path: this.path.join('/')}).then(res => {
          this.files = res.data.files
          this.path = res.data.path
        })
      },
      updateHeaders() {
        this.headers = {Authorization: getToken()}
      },
      submitLoginForm() {
        console.log("---submitLoginForm--")
        login(this.loginForm).then(res => {
          Message({message: '登录成功', type: 'success'})
          setToken(res.data.Authorization)
          this.loginFormVisible = false
          // 更新请求头内容
          this.updateHeaders()
          // 更新列表
          this.showFiles()
        })
      },
      uploadSuccess(response, file, fileList) {
        console.log('---uploadSuccess---', response, file, fileList)
        Message({message: '上传成功', type: 'success'})
        this.fileList = fileList.filter((f) => {
          return f.name !== file.name;
        })
        this.fileFormVisible = false
      },
      uploadError(err, file, fileList) {
        console.log('---uploadError---', err, file, fileList)
        Message({message: '上传失败', type: 'success'})
        this.fileList = fileList.filter((f) => {
          return f.name !== file.name;
        })
        this.fileFormVisible = false
      },
      downloadFile(filename) {
        window.location.href = `/api/download?filename=${encodeURI(this.path.join('/') + '/' + filename)}&token=${getToken()}`
      },
      copyMsg(data, event) {
        console.log(data)
        console.log(event)
        copyClipboard(data, event)
      },
      showMsgForm() {
        this.msgFormVisible = true
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
      isPC() {
        return window.innerWidth > 500;
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

  .pointer {
    cursor: pointer;
  }

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

  .row-bg {
    align-items: center;
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
</style>

<style>
  /** ------- pc端 --------- **/
  @media only screen and (min-width: 500px) {
    .el-upload-dragger .el-icon-upload {
      font-size: 46px !important;
      margin: 0 !important;
    }

    .el-upload-dragger {
      height: 90px !important;
      width: 500px !important;
      margin-bottom: 16px;
    }
  }

  /** ------- 移动端 ---------- **/
  @media only screen and (max-width: 500px) {
    .el-upload-dragger .el-icon-upload {
      font-size: 46px !important;
      margin: 0 !important;
    }

    .el-upload-dragger {
      height: 90px !important;
      width: 300px !important;
      margin-bottom: 16px;
    }
  }

</style>
