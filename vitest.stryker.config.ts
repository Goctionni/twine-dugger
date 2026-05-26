import { resolve } from 'node:path';

import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    environment: 'jsdom',
    reporters: ['default'],
    watch: false,
    css: false,
    sequence: {
      shuffle: false,
    },
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
  },
});
