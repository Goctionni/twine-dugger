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
    'vite-plus/prefer-vite-plus-imports': 'error',
  },
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        'unicorn/no-new-array': 'off',
        'typescript/no-floating-promises': 'off',
        'typescript/unbound-method': 'off',
        'eslint/init-declarations': 'off',
        'eslint/no-unassigned-vars': 'off',
      },
      jsPlugins: ['eslint-plugin-solid'],
      env: {
        browser: true,
      },
    },
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  jsPlugins: [
    {
      name: 'vite-plus',
      specifier: 'vite-plus/oxlint-plugin',
    },
  ],
});
