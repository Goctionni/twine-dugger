import { defineConfig, Options } from 'tsdown';
import solidPlugin from 'vite-plugin-solid';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from '@tailwindcss/postcss';

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
  },
  {
    ...baseOptions,
    clean: false,
    entry: { 'devtools-panel': 'src/devtools-panel/main.tsx' },
    noExternal: ['solid-js/web', 'solid-js/store','solid-js', 'clsx', 'immer'],
    plugins: [solidPlugin()],
  },
  {
    ...baseOptions,
    clean: false,
    entry: {
      'create-panel': 'src/create-panel/create-panel.ts',
      'content-script': 'src/content-script/content-script.ts',
    },
  },
]);
