module.exports = {
  devServer: {
    proxy: {
      '/sockjs-node/info': {
        target: 'http://172.16.11.57:8080',
        ws: true,
        changeOrigin: true
      },

    }
  }
}