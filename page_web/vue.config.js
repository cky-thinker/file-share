const {defineConfig} = require('@vue/cli-service')
const path = require('path');
const resolve = dir => path.join(__dirname, dir);
const name = "fileshare 文件共享"; // 网页标题
const port = process.env.port || process.env.npm_config_port || 8001; // 端口
module.exports = defineConfig({
  publicPath: './',
  outputDir: "dist",
  assetsDir: "static",
  productionSourceMap: true,
  devServer: {
    port: port,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5421'
      },
      '/sockjs-node/info': {
        target: 'http://127.0.0.1:8001',
        ws: true,
        changeOrigin: true
      },
    },
    historyApiFallback: true,
    client: {
      overlay: false,
    },
  },
  pages: {
    index: {
      entry: 'src/main.js',
      title: name
    }
  },
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
  },
  chainWebpack: config => {
    config.resolve.alias.set('@', resolve('src'));
    config.module
      .rule("svg")
      .exclude.add(resolve("src/assets/icons"))
      .end();
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/assets/icons"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]",
      })
      .end();
  },
})
