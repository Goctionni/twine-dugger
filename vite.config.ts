import { cp } from 'fs/promises';
import { resolve } from 'path';

import tailwindcss from '@tailwindcss/vite';
import solidJsDevtools from 'solid-devtools/vite';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vite-plus';

import { buildLib } from './build/build-lib.ts';
import { copyTransform } from './build/copy-transform.ts';
import { htmlInsertFontPlugin } from './build/html-insert-font.ts';
import { logResults } from './build/log-results.ts';
import { mockApiPlugin } from './build/plugin-mock-api.ts';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  staged: { '*': 'vp check --fix' },
  resolve: { alias: { '@': resolve(import.meta.dirname, './src') } },
  build: { minify: false, sourcemap: true },
  plugins: [
    solidJsDevtools({ autoname: true }),
    solidPlugin(),
    tailwindcss(),
    htmlInsertFontPlugin,
    mockApiPlugin(),
  ],
  lint: (await import('./oxlint.config.ts')).default,
  fmt: (await import('./oxfmt.config.ts')).default,
  environments: {},
  builder: {
    buildApp: async (builder) => {
      if (!('client' in builder.environments)) throw new Error('environments.client not found');
      const buildResult = await builder.build(builder.environments.client);

      if (Array.isArray(buildResult) || !('on' in buildResult)) {
        buildExtra();
      } else {
        buildResult.on('event', (e) => {
          if (e.code === 'BUNDLE_END') buildExtra();
        });
      }
    },
  },
});

async function buildExtra() {
  await cp('icons', 'dist/icons', { recursive: true });
  await logResults([
    // Manifest with version number
    copyTransform({
      from: 'src/manifest.json',
      to: 'dist/manifest.json',
      transform: (content) => content.replace(/\$version/g, packageJson.version),
    }),
    // create-panel.html
    copyTransform({
      from: 'src/create-panel/create-panel.html',
      to: 'dist/create-panel.html',
      transform: async (content) => content.replace('./create-panel.ts', './create-panel.js'),
    }),
    // create-panel.js
    buildLib({
      entry: { 'create-panel': 'src/create-panel/create-panel.ts' },
      deps: { onlyBundle: false, alwaysBundle: 'webextension-polyfill' },
    }),
    // content-script.js
    buildLib({
      entry: { 'content-script': 'src/content-script/content-script.ts' },
      deps: { onlyBundle: false, alwaysBundle: ['arktype'] },
    }),
  ]);
}
