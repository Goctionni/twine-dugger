import { defineConfig, Options } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

const baseOptions = {
  tsconfig: 'tsconfig.app.json',
  target: 'chrome135',
  platform: 'browser',
  minify: false,
  sourcemap: true,
  cjsInterop: true,
  replaceNodeEnv: false,
  format: 'esm',
  outDir: 'dist',
  minifyIdentifiers: false,
  treeshake: true,
} satisfies Options;

export default defineConfig((): Options[] => [
  {
    clean: true,
    publicDir: 'public',
    entry: { style: 'src/devtools-panel/index.css' },
  },
  {
    ...baseOptions,
    entry: { 'devtools-panel': 'src/devtools-panel/main.tsx' },
    noExternal: ['solid-js/web', 'solid-js', 'clsx', 'immer'],
    esbuildPlugins: [solidPlugin()],
  },
  {
    ...baseOptions,
    entry: {
      'create-panel': 'src/create-panel/create-panel.ts',
      'content-script': 'src/content-script/content-script.ts',
    },
  },
]);
