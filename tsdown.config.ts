import { defineConfig, Options } from 'tsdown';
import solidPlugin from 'vite-plugin-solid';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from '@tailwindcss/postcss';
import { mkdir } from 'fs/promises';

import packageJson from './package.json' with { type: 'json' };
import { getFontHtml } from './build/material-symbols';
import { copyTransform } from './build/copy-transform';

const baseOptions = {
  tsconfig: 'tsconfig.app.json',
  target: 'chrome135',
  platform: 'browser',
  minify: false,
  sourcemap: true,
  format: 'esm',
  outDir: 'dist',
  treeshake: true,
} satisfies Options;

export default defineConfig((): Options[] => [
  {
    clean: true,
    copy: [{ from: 'public', to: 'dist' }],
    entry: { style: 'src/devtools-panel/index.css' },
    plugins: [
      postcss({
        extract: true,
        plugins: [tailwindcss()],
      }),
      {
        name: 'copy-transform',
        transform: async (code) => {
          await mkdir('dist');
          await copyTransform({
            from: 'src/devtools-panel/manifest.json',
            to: 'dist/manifest.json',
            transform: (content) => content.replace(/\$version/g, packageJson.version),
          });

          await copyTransform({
            from: 'src/devtools-panel/index.html',
            to: 'dist/index.html',
            transform: async (content) =>
              content
                .replace('./main.tsx', './devtools-panel.js')
                .replace('<!--head-->', await getFontHtml(['search'])),
          });

          return code;
        },
      },
    ],
  },
  {
    ...baseOptions,
    clean: false,
    entry: { 'devtools-panel': 'src/devtools-panel/main.tsx' },
    noExternal: ['solid-js/web', 'solid-js', 'solid-js/store', 'clsx', 'immer'],
    plugins: [solidPlugin()],
  },
  {
    ...baseOptions,
    clean: false,
    format: 'iife',
    noExternal: ['zod'],
    entry: {
      'create-panel': 'src/create-panel/create-panel.ts',
      'content-script': 'src/content-script/content-script.ts',
    },
    outputOptions: (opts) => ({ ...opts, entryFileNames: `[name].js` }),
  },
]);
