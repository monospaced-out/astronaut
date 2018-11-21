const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = [{
  name: 'demo',
  mode: 'development',
  entry: './demo/demo.js',
  output: {
    filename: 'demo.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin()
  ]
}, {
  name: 'source',
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  }
}]
