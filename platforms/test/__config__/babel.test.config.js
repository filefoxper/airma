// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = require('babel-jest').createTransformer({
  plugins: [
    // ['babel-plugin-rewire-ts'],
    ['@babel/plugin-transform-runtime'],
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'lib',
        style: false, // `style: true` 会加载 less 文件
      },
    ],
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
});
