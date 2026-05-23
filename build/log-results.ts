import { styleText, type InspectColor } from 'util';

import { type TsdownBundle } from 'vite-plus/pack';

import { parseRolldownChunk } from './build-lib.ts';
import { parseCopyResultLogLine, type CopyTransformResult } from './copy-transform.ts';

export interface LogLine {
  relpath: string;
  filename: string;
  fullpath: string;
  filesize: string;
  gzipsize: string;
  mapsize: string;
}

interface LogCfg {
  pathLength: number;
  sizeLength: number;
  gzipsizeLength: number;
  mapsizeLength: number;
}

export function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

function getFileColor(filename: string): InspectColor {
  const ext = filename.split('.').at(-1);
  switch (ext) {
    case 'json':
      return 'yellow';
    case 'html':
      return 'green';
    case 'js':
      return 'cyan';
    default:
      return 'magenta';
  }
}

function logChunk(
  { filename, relpath, fullpath, filesize, gzipsize, mapsize }: LogLine,
  { pathLength, sizeLength, gzipsizeLength, mapsizeLength }: LogCfg,
) {
  const spaceStr = ' '.repeat(Math.max(0, pathLength - fullpath.length) + 1);
  const pathStr = [
    styleText(['dim'], relpath.replaceAll('\\', '/') + '/'),
    styleText(getFileColor(filename), filename),
    spaceStr,
  ].join('');

  const filesizeStr = filesize.padStart(sizeLength);
  const gzipsizeStr = gzipsize.padStart(gzipsizeLength);
  const mapsizeStr = mapsize.padStart(mapsizeLength);

  const size = [styleText(['bold'], filesizeStr), `gzip: ${gzipsizeStr}`];
  if (mapsize) size.push(`map: ${mapsizeStr}`);
  const sizeStr = styleText(['dim'], size.join(' | '));

  console.log(pathStr, sizeStr);
}

export function logLines(lines: LogLine[], elapsed: number) {
  const logCfg: LogCfg = {
    sizeLength: Math.max(...lines.map((l) => l.filesize.length)),
    gzipsizeLength: Math.max(...lines.map((l) => l.gzipsize.length)),
    mapsizeLength: Math.max(...lines.map((l) => l.mapsize.length)),
    pathLength: Math.max(...lines.map((l) => l.fullpath.length)),
  };

  if (lines.length) {
    console.log();
    console.log(styleText(['green'], `Additional assets in ${elapsed}ms`));
    for (const logline of lines) logChunk(logline, logCfg);
  }
}

export async function logResults(
  promises: Array<Promise<CopyTransformResult> | Promise<TsdownBundle[]>>,
) {
  const before = Date.now();
  const results = await Promise.all(promises);
  const lines = results.flatMap((result) => {
    if (Array.isArray(result)) {
      return result
        .flatMap((item) => item.chunks.map((chunk) => parseRolldownChunk(chunk)))
        .filter((value): value is LogLine => !!value);
    } else {
      return parseCopyResultLogLine(result);
    }
  });
  const elapsed = Date.now() - before;

  logLines(lines, elapsed);
}
