const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: {
    vendor: [
      "vue",
      "vue-i18n",
      "vue-router",
      "noty",
      "./src/renderer/vendor.scss",
    ],
    main: {
      import: [
        "./src/renderer/main/index.ts",
        "./src/renderer/main/index.scss",
      ],
      dependOn: "vendor",
    },
    "overlay-hmd": {
      import: [
        "./src/renderer/overlay-hmd/index.ts",
        "./src/renderer/overlay-hmd/index.scss",
      ],
      dependOn: "vendor",
    },
    "overlay-wrist": {
      import: [
        "./src/renderer/overlay-wrist/index.ts",
        "./src/renderer/overlay-wrist/index.scss",
      ],
      dependOn: "vendor",
    },
  },
  output: {
    filename: "[name].js",
    library: {
      type: "window",
    },
    pathinfo: false,
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        include: path.join(__dirname, "./src/renderer/locales/"),
        use: "@intlify/vue-i18n-loader",
        type: "javascript/auto",
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /^\?vue/,
            use: "pug-plain-loader",
          },
          {
            use: ["raw-loader", "pug-plain-loader"],
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          hotReload: false,
        },
      },
      {
        test: /\.(eot|png|svg|ttf|woff)/,
        type: "asset",
        generator: {
          filename: "assets/[name][ext]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".css", ".js", ".json", ".scss", ".ts", ".vue"],
    alias: {
      vue: path.join(
        __dirname,
        "./node_modules/vue/dist/vue.runtime.esm-browser.prod.js"
      ),
      "vue-i18n": path.join(
        __dirname,
        "./node_modules/vue-i18n/dist/vue-i18n.runtime.esm-browser.prod.js"
      ),
    },
  },
  performance: {
    hints: false,
  },
  devtool: "inline-source-map",
  target: "web", // 'electron-renderer' -> code splitting will not work
  stats: {
    preset: "errors-only",
    builtAt: true,
    timings: true,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new HtmlWebpackPlugin({
      filename: "main.html",
      template: "./src/renderer/main/index.pug",
      inject: false,
      minify: false,
    }),
    new HtmlWebpackPlugin({
      filename: "overlay-hmd.html",
      template: "./src/renderer/overlay-hmd/index.pug",
      inject: false,
      minify: false,
    }),
    new HtmlWebpackPlugin({
      filename: "overlay-wrist.html",
      template: "./src/renderer/overlay-wrist/index.pug",
      inject: false,
      minify: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./assets/",
          to: "./",
        },
      ],
    }),
  ],
  optimization: {
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
      // new CssMinimizerPlugin({
      //   minimizerOptions: {
      //     preset: [
      //       'default',
      //       {
      //         discardComments: {
      //           removeAll: true
      //         }
      //       }
      //     ]
      //   }
      // })
    ],
  },
};
