/* eslint-env node */

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/main/index.ts',
  output: {
    filename: 'index.js',
    library: {
      type: 'commonjs-module'
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
  target: 'electron-main',
  externals: ['better-sqlite3', 'native'],
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
