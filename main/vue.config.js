const path = require('path');
const resolve = dir => path.join(__dirname, dir);
module.exports = {
  publicPath: process.env.NODE_ENV === "development" ? './' : '././',
  chainWebpack: config => {
    config.resolve.alias.set('@', resolve('src'));
  },
  devServer: {
    proxy: {
      '/sockjs-node/info': {
        target: 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      },

    }
  }
}