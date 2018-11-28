const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = [{
  entry: './src/ki-ethereum-ui.js',
  mode: 'development',
  output: {
    filename: 'ki-ethereum-ui.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
}]
