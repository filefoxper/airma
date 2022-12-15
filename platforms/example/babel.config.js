module.exports = api => {
  const defaultPlugins = [
    ['@babel/plugin-transform-runtime'],
    ['@babel/plugin-proposal-decorators', { legacy: true }]
  ];
  const env = api.env();
  return env === 'development'
    ? {
        plugins: ['react-refresh/babel', ...defaultPlugins],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                chrome: '63'
              },
              useBuiltIns: 'usage',
              corejs: { version: 3, proposals: true }
            }
          ],
          '@babel/preset-react',
          '@babel/preset-typescript'
        ]
      }
    : env === 'test'
    ? {}
    : {
        plugins: defaultPlugins,
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                chrome: '63'
              },
              useBuiltIns: 'usage',
              corejs: { version: 3, proposals: true }
            }
          ],
          '@babel/preset-react',
          '@babel/preset-typescript'
        ]
      };
};
