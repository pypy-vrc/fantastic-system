/* eslint-env node */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const {VueLoaderPlugin} = require('vue-loader');

module.exports = {
  entry: {
    vendor: [
      './src/electron-renderer/vendor/vendor.js',
      './src/electron-renderer/vendor/vendor.scss'
    ],
    main: [
      './src/electron-renderer/main/index.ts',
      './src/electron-renderer/main/index.scss'
    ],
    'overlay-hmd': [
      './src/electron-renderer/overlay-hmd/index.ts',
      './src/electron-renderer/overlay-hmd/index.scss'
    ],
    'overlay-wrist': [
      './src/electron-renderer/overlay-wrist/index.ts',
      './src/electron-renderer/overlay-wrist/index.scss'
    ]
  },
  output: {
    filename: '[name].js',
    library: {
      type: 'window'
    }
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        include: path.join(__dirname, './src/locales/'),
        use: '@intlify/vue-i18n-loader',
        type: 'javascript/auto'
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /^\?vue/,
            use: 'pug-plain-loader'
          },
          {
            use: ['raw-loader', 'pug-plain-loader']
          }
        ]
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          hotReload: false
        }
      },
      {
        test: /\.(eot|png|svg|ttf|woff)/,
        type: 'asset',
        generator: {
          filename: 'assets/[name][ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.css', '.js', '.json', '.scss', '.ts', '.vue'],
    alias: {
      vue: path.join(
        __dirname,
        './node_modules/vue/dist/vue.runtime.esm-browser.prod.js'
      ),
      'vue-i18n': path.join(
        __dirname,
        './node_modules/vue-i18n/dist/vue-i18n.runtime.esm-browser.prod.js'
      )
    }
  },
  performance: {
    hints: false
  },
  devtool: 'inline-source-map',
  target: 'electron-renderer',
  stats: {
    preset: 'errors-only',
    builtAt: true,
    timings: true
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new HtmlWebpackPlugin({
      filename: 'main.html',
      template: './src/electron-renderer/main/index.pug',
      inject: false,
      minify: false
    }),
    new HtmlWebpackPlugin({
      filename: 'overlay-hmd.html',
      template: './src/electron-renderer/overlay-hmd/index.pug',
      inject: false,
      minify: false
    }),
    new HtmlWebpackPlugin({
      filename: 'overlay-wrist.html',
      template: './src/electron-renderer/overlay-wrist/index.pug',
      inject: false,
      minify: false
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './assets/',
          to: './'
        }
      ]
    })
  ],
  optimization: {
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
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
    ]
  }
};
