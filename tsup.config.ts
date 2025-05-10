import { defineConfig, Options } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

export default defineConfig((options): Options[] => [
  {
    clean: true,
    config: './tsconfig.app.json',
    target: 'esnext',
    platform: 'browser',
    format: 'esm',
    entry: { 'devtools-panel': 'src/devtools-panel/main.tsx' },
    outDir: 'dist',
    treeshake: options.watch ? false : { preset: 'safest' },
    replaceNodeEnv: true,
    noExternal: ['solid-js/web', 'solid-js', 'zod', 'uuid'],
    esbuildPlugins: [solidPlugin()],
    publicDir: 'public',
  },
  {
    config: './tsconfig.app.json',
    target: 'esnext',
    platform: 'browser',
    format: 'esm',
    entry: {
      'create-panel': 'src/create-panel/create-panel.ts',
      'content-script': 'src/content-script/content-script.ts',
      'service-hub': 'src/service-hub/service-hub.ts',
    },
    outDir: 'dist',
    treeshake: options.watch ? false : { preset: 'safest' },
    replaceNodeEnv: true,
    esbuildPlugins: [solidPlugin()],
    splitting: false,
    noExternal: ['zod', 'uuid'],
  },
]);
