/* eslint-env node */

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/electron-main/index.ts',
  output: {
    filename: 'index.js',
    library: {
      type: 'commonjs-module'
    }
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        loader: 'node-loader'
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.node', '.ts']
  },
  performance: {
    hints: false
  },
  devtool: 'inline-source-map',
  target: 'electron-main',
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
    native: 'commonjs native'
  },
  stats: {
    preset: 'errors-only',
    builtAt: true,
    timings: true
  },
  plugins: [],
  optimization: {
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  }
};
