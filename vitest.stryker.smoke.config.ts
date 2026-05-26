import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['src/shared/type-helpers.test.ts'],
    environment: 'node',
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
