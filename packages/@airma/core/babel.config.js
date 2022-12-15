module.exports = {
  plugins: [
    ['@babel/plugin-transform-runtime'],
    ['@babel/plugin-proposal-decorators', { legacy: true }]
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          chrome: '58',
          edge:'16',
          firefox:'57',
          safari:'11'
        },
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true }
      }
    ],
    '@babel/preset-typescript'
  ]
};
