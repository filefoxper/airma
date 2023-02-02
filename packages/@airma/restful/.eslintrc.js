const config = require('../../../.eslintrc.js');
const path = require('path');

const tsConfigPath = path.resolve(__dirname, 'tsconfig.json');

module.exports = {
    ...config,
    env: {
        es2021: true,
        node: true
    },
    parserOptions: {
        ...config.parserOptions,
        tsconfigRootDir: __dirname,
        project: tsConfigPath
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {
                project: path.resolve(__dirname, 'tsconfig.json')
            },
            node: {
                project: ['tsconfig.json']
            }
        }
    }
};
