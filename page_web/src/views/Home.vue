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
        <el-button @click="submitFileVisible= true"><svg-icon name="发送文件" iconStyle="height: 1em; weight: 1em;"/> <span>上传文件</span></el-button>
        <el-button @click="submitMsgVisible= true"><svg-icon name="发送消息" iconStyle="height: 1em; weight: 1em;"/> <span>上传消息</span></el-button>
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
              <el-tooltip class="item" effect="dark" :content="scope.row.type === 'text' ? scope.row.content : scope.row.name" placement="top-start">
                <div>{{scope.row.name}}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column width="70">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'file'" @click="console.log(scope)" icon="el-icon-download"
                         size="mini" plain></el-button>
              <el-button v-if="scope.row.type === 'text'" @click="console.log(scope)" icon="el-icon-document-copy"
                         size="mini" plain></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-dialog
      title="上传文件"
      customClass="dialog"
      :visible.sync="submitFileVisible">
      <div style="display: flex; justify-content: center">
        <el-upload
          drag
          action="https://jsonplaceholder.typicode.com/posts/">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
    </el-dialog>
    <el-dialog
      title="上传文本"
      customClass="dialog"
      :visible.sync="submitMsgVisible">
      <el-form ref="form" :model="msgForm" label-width="80px">
        <el-form-item label="文本内容">
          <el-input type="textarea" :rows="5" v-model="msgForm.msg"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="submitMsgVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitMsgVisible = false">提 交</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import FileIcon from "@/components/FileIcon";
  import SvgIcon from "@/components/SvgIcon";

  let id = 1;

  function getId() {
    return id++;
  }

  export default {
    name: 'HomeView',
    data() {
      return {
        submitFileVisible: false,
        fileForm: {

        },
        submitMsgVisible: false,
        msgForm: {
          msg: ''
        },
        files: [
          {id: getId(), name: '文件夹', type: 'directory', hasChildren: true},
          {id: getId(), name: 'test.txt', type: 'file'},
          {id: getId(), name: 'test.doc', type: 'file'},
          {id: getId(), name: 'test.ppt', type: 'file'},
          {id: getId(), name: 'test.ppt', type: 'file'},
          {id: getId(), name: 'fasdfasdfasdfasfassdfa', type: 'text', content: 'fasdfasdfasdfasfassdfa'}
        ]
      }
    },
    methods: {
      listFiles(tree, treeNode, resolve) {
        setTimeout(() => {
          console.log(tree, treeNode)
          resolve([
            {id: getId(), name: 'test.ppt', type: 'file'},
            {id: getId(), name: '文件夹', type: 'directory', hasChildren: true},
          ])
        }, 200)
      },

    },
    computed: {
      dialogWidth() {
        let width = window.innerWidth > 500 ? Math.min(window.innerWidth * 0.5, 700) : window.innerWidth * 0.95;
        console.log(width)
        return String(width);
      },
      listHeight() {
        return window.innerHeight - 260;
      }
    },
    components: {
      FileIcon, SvgIcon
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
