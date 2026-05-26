import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [solidPlugin({ hot: false })],
  test: {
    include: ['tests/mutation/smoke.test.tsx'],
    // Smoke suite contains Solid component tests, so default to jsdom.
    environment: 'jsdom',
    // Keeping "jest-dom" in this local setup path prevents vite-plugin-solid
    // from injecting an absolute /@fs path that breaks inside Stryker sandbox.
    setupFiles: ['tests/mutation/jest-dom.noop.setup.ts'],
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
