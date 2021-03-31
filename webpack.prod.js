const path = require("path")
const common = require("./webpack.common")
const merge = require("webpack-merge")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
var HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "[name].[contentHash].bundle.js",
    path: path.resolve(__dirname, "build/public"),
  },
  optimization: {
    nodeEnv: "production",
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    minimize: true,
    minimizer: [
      new OptimizeCssAssetsPlugin(),
      new TerserPlugin(),
      new HtmlWebpackPlugin({
        template: "./src/html/template.html",
        // TODO: SMICS-0.8
        // title: "HiGhmed Dashboard 2.0",
        title: "SMICS 0.8",
        filename: "index.html",
        favicon: "./src/img/favicon-230x230.png",
        minify: {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
        },
      }),
      // new webpack.HotModuleReplacementPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contentHash].css",
      chunkFilename: "[id].[hash].css",
    }),
    new CleanWebpackPlugin(),
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        ecma: 6,
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader, //3. Extract css into files
          "css-loader", //2. Turns css into commonjs
          "sass-loader", //1. Turns sass into css
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, //2. Extract css into files
          "css-loader", //1. Turns css into commonjs
        ],
      },
    ],
  },
})
