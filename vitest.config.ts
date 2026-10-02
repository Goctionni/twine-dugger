import { resolve } from 'node:path';

import solidPlugin from '@solidjs/vite-plugin';
import { defineConfig, type PluginOption } from 'vite-plus';

export default defineConfig({
  plugins: [solidPlugin({ hot: false }) as PluginOption],
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
