import { basename, dirname, relative, resolve } from 'path';
import { gzipSync } from 'zlib';

import { build, type InlineConfig, type RolldownChunk } from 'vite-plus/pack';

import { formatSize, type LogLine } from './log-results.ts';

export function buildLib(config: Partial<InlineConfig>) {
  return build({
    tsconfig: 'tsconfig.app.json',
    format: 'iife',
    clean: false,
    logLevel: 'warn',
    target: 'chrome135',
    platform: 'browser',
    minify: false,
    sourcemap: true,
    outDir: 'dist',
    treeshake: true,
    outputOptions: (opts) => ({ ...opts, entryFileNames: `[name].js` }),
    ...config,
  });
}

export function parseRolldownChunk(c: RolldownChunk): LogLine | null {
  if (c.type !== 'chunk') return null;

  const relativePath = relative(import.meta.dirname, resolve(c.outDir, c.fileName));
  const dir = dirname(relativePath);
  const filename = basename(relativePath);

  const sizeBytes = Buffer.byteLength(c.code);
  const gzipBytes = gzipSync(c.code).length;
  const mapBytes = c.map ? Buffer.byteLength(c.map.toString()) : 0;

  return {
    filename,
    relpath: dir,
    fullpath: relativePath,
    filesize: formatSize(sizeBytes),
    gzipsize: formatSize(gzipBytes),
    mapsize: mapBytes ? formatSize(mapBytes) : '',
  };
}
