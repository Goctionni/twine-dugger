import solid from 'eslint-plugin-solid';
import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['oxc', 'typescript', 'unicorn'],
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  ignorePatterns: ['dist'],
  rules: {
    'typescript/no-floating-promises': 'off',
    'unicorn/no-new-array': 'off',
    'vite-plus/prefer-vite-plus-imports': 'error',
    'typescript/unbound-method': 'off',
    'eslint/no-unassigned-vars': 'off',
  },
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      jsPlugins: ['eslint-plugin-solid'],
      env: { browser: true },
      rules: solid.configs['flat/typescript'].rules,
    },
  ],
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'warn',
    denyWarnings: true,
  },
  jsPlugins: [
    {
      name: 'vite-plus',
      specifier: 'vite-plus/oxlint-plugin',
    },
  ],
});
