import { resolve } from 'node:path';

import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [solid({ hot: false })],
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      '@': resolve(__dirname, 'src'),
      '@panel': resolve(__dirname, 'src/devtools-panel'),
      '@content': resolve(__dirname, 'src/content-script'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
  },
});
