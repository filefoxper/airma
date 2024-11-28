const path = require('path');

const tsConfig = path.resolve(__dirname, 'tsconfig.json');

/** @type {import('eslint').Linter.Config} */
module.exports = {
    parserOptions: {
        project: tsConfig,
        tsconfigRootDir: __dirname,
    },
    settings: {
        'import/resolver': {
            typescript: {
                project: tsConfig,
            },
        },
    },
};
