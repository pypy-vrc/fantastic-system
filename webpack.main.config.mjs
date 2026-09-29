import TerserPlugin from "terser-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

export default {
  entry: {
    index: "./src/main/index.ts",
  },
  output: {
    filename: "[name].mjs",
    library: {
      type: "module",
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
