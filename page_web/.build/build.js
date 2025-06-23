const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');
const { env } = process;

// 定义要执行的命令
const buildCommand = 'vue-cli-service build';
const sourceDistDir = path.resolve(__dirname, '..', 'dist')
const targetDir = env.BUILD_TYPE === 'utool' ? path.resolve(__dirname, '..', '..', 'utools', 'page_web') : path.resolve(__dirname, '..', '..', 'electron', 'dist', 'page_web')
console.log('构建目录', sourceDistDir)
console.log('打包目录', targetDir)

// 执行构建命令
console.log('正在构建项目...');
exec(buildCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`构建失败: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);

  console.log('项目构建完成.');

  let distDir = path.resolve(targetDir, '..');
  fs.mkdir(distDir, {recursive: true}, (err) => {
    if (err) {
      console.error('无法创建目录:', distDir, err);
    }

    console.log('删除旧的目录.', targetDir);
    fs.rm(targetDir, {recursive: true, force: true}, (err) => {
      if (err) {
        console.error('删除目录失败', targetDir, err);
        return;
      }
      console.log('旧目录已删除.');

      fs.rename(sourceDistDir, targetDir, (err) => {
        if (err) {
          console.error('移动目录失败', err);
          return;
        }
        console.log('目录移动成功.');
      });
    });
  });
});
