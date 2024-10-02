const { configure, presets } = require('eslint-kit');

module.exports = configure({
  mode: 'only-errors',
  presets: [presets.imports(), presets.typescript(), presets.prettier(), presets.node()],
  plugins: ['require-extensions', 'plugin:md/recommended'],
  extend: {
    overrides: [
      {
        files: ['*.md'],
        parser: 'markdown-eslint-parser',
        rules: {
          'prettier/prettier': ['error', { parser: 'markdown' }],
        },
      },
      {
        files: ['*.ts'],
        rules: {
          'no-irregular-whitespace': ['error', { skipTemplates: true }],
        },
      },
    ],
    rules: {
      /* Project preferences */

      'import/no-default-export': 'off',
      'import/no-unresolved': ['error', { ignore: ['^virtual:'] }],
      'no-console': 'off',
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      'require-atomic-updates': ['error', { allowProperties: true }],
      '@typescript-eslint/consistent-type-imports': 'error',

      /* Prettier conflicts */

      'unicorn/no-nested-ternary': 'off',
      'unicorn/number-literal-case': 'off',
    },
  },
});
