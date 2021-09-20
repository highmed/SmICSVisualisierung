const path = require("path")
const common = require("./webpack.common")
const merge = require("webpack-merge")
var HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./src/public",
    historyApiFallback: true,
    hot: true,
    overlay: {
      errors: true,
      warnings: true,
      port: 8080,
    },
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/html/template.html",
      // TODO: SMICS-0.8
      // title: "HiGhmed Dashboard 2.0",
      title: "SMICS 0.8",
      filename: "index.html",
      favicon: "./src/img/favicon-230x230.png",
    }),
    // new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "style-loader", //3. Inject styles into DOM
          "css-loader", //2. Turns css into commonjs
          "sass-loader", //1. Turns sass into css
        ],
      },
      {
        test: /\.css$/,
        use: [
          "style-loader", //2. Extract css into files
          "css-loader", //1. Turns css into commonjs
        ],
      },
    ],
  },
})
