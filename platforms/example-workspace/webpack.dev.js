const generateConfig = require('./webpack.basic');
const EslintWebpackPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WebpackBar = require('webpackbar');
const path = require('path');

module.exports = function config() {
  const core = generateConfig();
  return {
    ...core,
    optimization: {
      splitChunks: core.optimization.splitChunks
    },
    resolve: {
      ...core.resolve,
      alias: {
        "@airma/react-state":"@airma/react-state/src",
        "@airma/restful":"@airma/restful/src",
        "@airma/react-hooks-core":"@airma/react-hooks-core/src",
        "@airma/react-effect":"@airma/react-effect/src",
        "@airma/react-hooks":"@airma/react-hooks/src",
      }
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: true,
            typescript: {
                memoryLimit: 4096,
            },
        }),
        new EslintWebpackPlugin({
            context: path.join(__dirname, '..','..'),
            extensions: ['ts', 'tsx'],
            files: [
                path.join('.', 'platforms', 'example-workspace','src'),
            ],
            emitWarning: false,
            cacheLocation: path.join(__dirname, 'node_modules', '.cache', 'eslint-develop'),
        }),
      new ReactRefreshPlugin({
        esModule:true
      }),
      new HtmlWebpackPlugin({
        plugin: 'html',
        filename: path.join(__dirname, 'dist', 'index.html'),
        template: path.join(__dirname, 'res', 'template.dev.index.html'),
        inject: true
      }),
      new WebpackBar({
        color: 'green', // 默认green，进度条颜色支持HEX
        basic: false, // 默认true，启用一个简单的日志报告器
        profile: false // 默认false，启用探查器。
      })
    ],
    mode: "development",
    devServer: {
      // 刷新时，让当前域名下的url访问 index.html
      historyApiFallback: true,
      // 热编译
      hot: true,
      // 虚拟服务器IP
      host: '0.0.0.0',
      // 虚拟服务器端口
      port: 8081,
      proxy:{
        '/api/*': {
          target: `http://localhost:9999`,
          secure: false
        },
      }
    }
  };
};
