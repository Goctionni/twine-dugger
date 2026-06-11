import { defineConfig } from 'oxfmt';

export default defineConfig({
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'all',
  printWidth: 100,
  singleQuote: true,
  quoteProps: 'consistent',
  jsxSingleQuote: false,
  semi: true,
  arrowParens: 'always',
  ignorePatterns: ['node_modules', 'extension', 'dist', 'dist-ff', 'pnpm-lock.yaml'],
  sortImports: true,
  sortPackageJson: true,
  sortTailwindcss: {
    functions: ['clsx', 'btnClass'],
    preserveWhitespace: true,
    stylesheet: './src/devtools-panel/style.css',
  },
});
