import { mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

import tailwindcss from '@tailwindcss/postcss';
import postcss from 'rollup-plugin-postcss';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vite-plus';
import type { UserConfig } from 'vite-plus/pack';

import { copyTransform } from './build/copy-transform.ts';
import { getFontHtml } from './build/material-symbols.ts';
import packageJson from './package.json' with { type: 'json' };

const baseOptions = {
  tsconfig: 'tsconfig.app.json',
  target: 'chrome135',
  platform: 'browser',
  minify: false,
  sourcemap: true,
  format: 'esm',
  outDir: 'dist',
  treeshake: true,
} satisfies UserConfig;

export default defineConfig({
  staged: { '*': 'vp check --fix' },
  pack: [
    {
      clean: true,
      entry: { style: 'src/devtools-panel/index.css' },
      plugins: [
        postcss({
          extract: true,
          plugins: [tailwindcss()],
        }),
        {
          name: 'copy-transform',
          transform: async (code) => {
            await mkdir('dist', { recursive: true }).catch(() => {});
            await copyTransform({
              from: 'src/devtools-panel/manifest.json',
              to: 'dist/manifest.json',
              transform: (content) => content.replace(/\$version/g, packageJson.version),
            });

            await copyTransform({
              from: 'src/create-panel/create-panel.html',
              to: 'dist/create-panel.html',
              transform: async (content) =>
                content.replace('./create-panel.ts', './create-panel.js'),
            });

            await copyTransform({
              from: 'src/devtools-panel/index.html',
              to: 'dist/index.html',
              transform: async (content) =>
                content
                  .replace('./main.tsx', './devtools-panel.js')
                  .replace(
                    '<!--head-->',
                    await getFontHtml([
                      'search',
                      'data_object',
                      'settings',
                      'content_copy',
                      'close',
                    ]),
                  ),
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
      deps: {
        onlyBundle: false,
        alwaysBundle: [
          '@solid-primitives/scheduled',
          'solid-js/web',
          'solid-js',
          'solid-js/store',
          '@tanstack/solid-virtual',
          'clsx',
          'oniguruma-to-es',
          'vscode-textmate',
        ],
      },
      plugins: [solidPlugin()],
    },
    {
      ...baseOptions,
      clean: false,
      format: 'iife',
      entry: { 'create-panel': 'src/create-panel/create-panel.ts' },
      outputOptions: (opts) => ({ ...opts, entryFileNames: `[name].js` }),
    },
    {
      ...baseOptions,
      clean: false,
      format: 'iife',
      deps: {
        onlyBundle: false,
        alwaysBundle: ['zod'],
      },
      entry: { 'content-script': 'src/content-script/content-script.ts' },
      outputOptions: (opts) => ({ ...opts, entryFileNames: `[name].js` }),
    },
  ],
  lint: (await import('./oxlint.config.ts')).default,
  fmt: (await import('./oxfmt.config.ts')).default,
});
