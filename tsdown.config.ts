import { defineConfig, Options } from 'tsdown';
import solidPlugin from 'vite-plugin-solid';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from '@tailwindcss/postcss';
import { readFile, writeFile } from 'fs/promises';

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
    ],
    onSuccess: async () => {
      const manifest = await readFile('src/devtools-panel/manifest.json', 'utf-8');
      const transformed = manifest.replace(/\$version/g, packageJson.version);
      await writeFile('dist/manifest.json', transformed, { encoding: 'utf-8' });
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
