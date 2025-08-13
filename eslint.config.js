import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid';
import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      solid,
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...solid.configs.recommended.rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  prettier,
);
