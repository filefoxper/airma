module.exports = {
    env: {
        "browser": true,
        "es2021": true
    },
    extends: [
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    parser: "@typescript-eslint/parser",
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        self: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        tsconfigRootDir: '.',
        project: ['./tsconfig.json']
    },
    plugins: [
        "@typescript-eslint"
    ],
    rules: {
        'import/extensions': 'off',
        'no-param-reassign': 'off',
        'import/no-unresolved':'off',
        '@typescript-eslint/no-unused-vars': ['off'],
        'react/jsx-filename-extension': [
            'off',
            { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
        ],
        'react/jsx-props-no-spreading': 'off',
        'import/prefer-default-export': 'off',
        'max-classes-per-file': 'off',
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'react/require-default-props': 'off',
        camelcase: 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': [
            'error',
            { functions: false, classes: true }
        ],
        'react/no-did-update-set-state': 'error',
        'no-shadow': 'off',
        'class-methods-use-this': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/mouse-events-have-key-events': 'off',
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'no-bitwise': 'off',
        '@typescript-eslint/no-shadow': 'warn',
        '@typescript-eslint/no-explicit-any':'off',
        'jsx-a11y/media-has-caption': 'off'
    }
}
