import { defineConfig } from 'tsdown';
import type { Options } from 'tsdown';
import solidPlugin from 'vite-plugin-solid';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from '@tailwindcss/postcss';
import { mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

import packageJson from './package.json' with { type: 'json' };
import { getFontHtml } from './build/material-symbols.ts';
import { copyTransform } from './build/copy-transform.ts';

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
    onSuccess: async () => {
      await rm(resolve(import.meta.dirname, 'dist/style.js'), { force: true });
    },
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
