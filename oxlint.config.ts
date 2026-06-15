import solid from 'eslint-plugin-solid';
import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['eslint', 'oxc', 'typescript', 'unicorn', 'import', 'vitest'],
  jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'warn',
    denyWarnings: true,
  },
  env: { builtin: true },
  ignorePatterns: ['dist', 'dist-ff'],
  rules: {
    'typescript/no-floating-promises': 'off',
    'unicorn/no-new-array': 'off',
    'vite-plus/prefer-vite-plus-imports': 'error',
    'typescript/unbound-method': 'off',
    'eslint/no-unassigned-vars': 'off',
    'typescript/consistent-type-imports': 'error',
    'no-unused-vars': ['error', { varsIgnorePattern: 'tooltip', argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['src/devtools-panel/**/*.{ts,tsx}'],
      jsPlugins: ['eslint-plugin-solid'],
      env: { browser: true },
      rules: solid.configs['flat/typescript'].rules,
    },
    {
      files: ['src/**/*.test.{ts,tsx}'],
      plugins: ['vitest', 'jest', 'typescript'],
      env: { vitest: true },
      jsPlugins: ['eslint-plugin-testing-library'],
      rules: {
        'vitest/require-mock-type-parameters': 'off',
      },
    },
  ],
});
