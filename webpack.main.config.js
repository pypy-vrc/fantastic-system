const TerserPlugin = require("terser-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/main/index.ts",
  },
  output: {
    filename: "[name].js",
    library: {
      type: "commonjs-module",
    },
    pathinfo: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json", ".ts"],
  },
  performance: {
    hints: false,
  },
  devtool: "inline-source-map",
  target: "electron-main",
  externals: ["native"],
  stats: {
    preset: "errors-only",
    builtAt: true,
    timings: true,
  },
  plugins: [new ForkTsCheckerWebpackPlugin()],
  optimization: {
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};
