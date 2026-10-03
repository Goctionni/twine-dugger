import { resolve } from 'node:path';

import solidPlugin from '@solidjs/vite-plugin';
import { defineConfig, type PluginOption } from 'vite-plus';

export default defineConfig({
  plugins: [solidPlugin({ hot: false }) as PluginOption],
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@panel': resolve(import.meta.dirname, 'src/devtools-panel'),
      '@content': resolve(import.meta.dirname, 'src/content-script'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    sequence: { shuffle: true },
  },
});
