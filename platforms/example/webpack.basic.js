const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function config() {
  return {
    entry: {
      bundle: path.join(__dirname, 'src', 'index.tsx')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].[chunkhash].js'
    },
    optimization: {
      noEmitOnErrors: true,
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false
        })
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          libs: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|history)[\\/]/,
            name: 'commons',
            reuseExistingChunk: true,
            chunks: 'all'
          }
        }
      }
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json', 'txt'],
      plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]
    },
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
        },
        {
          // 图片处理
          test: /\.(gif|png|jpg|jpeg|otf)$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'url-loader',
            options: {
              // 超过 1024b 的文件以文件形式被转出，否则被编译成 base64 字符串嵌入js代码
              limit: 1024 * 6
            }
          }
        },
        {
          // less处理
          test: /\.less$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            // 将 css-loader 提交的 css 内存文件放入 <style>...</style> 字符串中，写入引用的js文件
            'style-loader',
            {
              // 解析 less 提交的 css 内存文件，
              // 通过模块化的方式将css文件中的class名称编译成一个规则的hash字符串，
              // 并将这些字符串与模块化的css引用对象的key相对应，即变成该对象的值，
              // 最后将洗过的 css 内存文件提交给 style-loader
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]_[local]_[hash:base64:5]'
                }
              }
            },
            'less-loader'
          ]
        },
        // 因为该项目没有css文件，为了防止第三方库引用css产生漏洞，加层保险
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        // 目的跟上面的一样，不过是针对第三方less文件
        {
          test: /\.less$/,
          include: /(node_modules|bower_components)/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'less-loader'
            }
          ]
        },
        // 文件处理
        {
          test: /\.(ttf|eot|woff|woff2|svg)$/,
          use: ['file-loader']
        }
      ]
    },

  };
};
