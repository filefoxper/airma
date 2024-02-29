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
          chrome: '91',
          edge:'91',
          firefox:'90',
          safari:'15'
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
