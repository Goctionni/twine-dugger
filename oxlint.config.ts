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
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'test/**/*'],
      plugins: ['vitest', 'jest', 'typescript'],
      jsPlugins: [
        {
          name: 'testing-library',
          specifier: 'eslint-plugin-testing-library',
        },
      ],
      rules: {
        'vitest/expect-expect': 'error',
        'vitest/prefer-called-with': 'error',
        'vitest/max-expects': 'off', // Remove limit to allow deep state verification
        'vitest/prefer-strict-equal': 'error', // Force toStrictEqual over toEqual
        'vitest/no-conditional-in-test': 'error', // Prevent branch logic in tests
        'vitest/prefer-to-be': 'error',
        'testing-library/prefer-explicit-assert': 'error',
        'typescript/no-unnecessary-condition': 'error',

        'no-restricted-properties': [
          'error',
          {
            property: 'toContainEqual',
            message: 'Mutation Risk: Use toStrictEqual.',
          },
          {
            property: 'toContain',
            message: 'Mutation Risk: Match exact array structure.',
          },
          {
            property: 'toHaveBeenCalled',
            message: 'Mutation Risk: Shallow check. Use toHaveBeenCalledWith.',
          },
          {
            object: 'expect',
            property: 'arrayContaining',
            message: 'Mutation Risk: Use exact array structure.',
          },
          {
            object: 'expect',
            property: 'objectContaining',
            message: 'Mutation Risk: Use exact object structure.',
          },
        ],
      },
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
