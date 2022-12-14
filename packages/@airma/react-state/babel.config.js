module.exports = {
  plugins: [
    ['@babel/plugin-transform-runtime']
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
        forceAllTransforms:true,
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true }
      }
    ],
    '@babel/preset-react',
    '@babel/preset-typescript'
  ]
};
