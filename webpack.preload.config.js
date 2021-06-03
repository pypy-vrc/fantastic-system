/* eslint-env node */

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/preload/index.ts',
  output: {
    filename: 'preload.js',
    library: {
      type: 'window'
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.ts']
  },
  performance: {
    hints: false
  },
  devtool: 'inline-source-map',
  target: 'electron-preload',
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
