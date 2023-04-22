const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function config() {
  return {
    externals: {
      '@airma/core': '@airma/core',
      react:'react'
    },
    entry: {
      bundle: path.join(__dirname, 'src', 'index.ts')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'index.js',
      library:"@airma/react-hooks",
      libraryTarget: 'umd'
    },
    optimization: {
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false
        })
      ]
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json', 'txt'],
      plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]
    },
    mode: "production",
    target: ['web', 'es5'],
    module: {
      rules: [
        {
          test: /\.js$|\.ts$|\.tsx$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            }
          ]
        }
      ]
    }
  };
};
