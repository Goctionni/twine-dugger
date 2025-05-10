import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';

// Directly use import.meta.dirname (Node.js 20.11.0+/21.2.0+)
const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [solidPlugin()],
  base: '',
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        createPanel: resolve(__dirname, 'create-panel.html'),
      },
      output: {
        format: 'esm',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'createPanel') return 'create-panel.js';
          if (chunkInfo.name === 'main') return 'devtools-panel.js';
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'esnext',
    outDir: 'extension/vite',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
});
