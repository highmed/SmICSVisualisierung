module.exports = {
  stats: 'minimal', // see: https://webpack.js.org/configuration/stats/#stats-presets
  entry: {
    main: "./src/public/index.js",
    app: [
      "./node_modules/react-grid-layout/css/styles.css",
      "./node_modules/react-resizable/css/styles.css",
      // "react-hot-loader/patch",
    ],
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
      {
        test: /\.(svg|png|jpg|gif)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[hash].[ext]",
            outputPath: "imgs",
          },
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[hash].[ext]",
            outputPath: "fonts",
          },
        },
      },
      {
        test: /\.(csv|tsv)$/,
        use: {
          loader: "csv-loader",
          options: {
            name: "[name].[hash].[ext]",
            outputPath: "tables",
          },
        },
      },
      {
        test: /\.xml$/,
        use: ["xml-loader"],
      },
    ],
  },
}
