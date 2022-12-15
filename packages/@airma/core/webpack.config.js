const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function config() {
  return {
    entry: {
      bundle: path.join(__dirname, 'src', 'index.ts')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'index.js',
      library:"@airma/core",
      libraryTarget: 'umd'
    },
    optimization: {
      noEmitOnErrors: true,
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
    module: {
      // 文件编译规则
      rules: [
        {
          // 匹配文件名
          test: /\.js$|\.ts$|\.tsx$/,
          // 排除匹配目录
          exclude: /(node_modules|bower_components)/,
          // 使用编译接驳器 babel-loader，
          // babel-loader 会自动寻找 .babelrc，babel.config.js等文件，将配置信息merge成 babel 解析配置信息
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
