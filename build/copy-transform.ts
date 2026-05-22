import { readFile, writeFile } from 'fs/promises';
import { basename, dirname, relative, resolve } from 'path';
import { cwd } from 'process';
import { gzipSync } from 'zlib';

import { formatSize, type LogLine } from './log-results.ts';

interface Options {
  from: string;
  to: string;
  transform: (content: string) => string | Promise<string>;
  root?: string;
}

export interface CopyTransformResult extends Pick<Options, 'from' | 'to'> {
  absolutePath: string;
  content: string;
}

export async function copyTransform({
  from,
  to,
  transform,
  root = cwd(),
}: Options): Promise<CopyTransformResult> {
  const filecontent = await readFile(resolve(root, from), 'utf-8');
  const transformed = await transform(filecontent);
  const absolutePath = resolve(root, to);
  await writeFile(absolutePath, transformed, { encoding: 'utf-8' });
  return { from, to, absolutePath, content: transformed };
}

export function parseCopyResultLogLine({ content, absolutePath }: CopyTransformResult): LogLine {
  const filename = basename(absolutePath);
  const filesize = Buffer.byteLength(content);
  const gzipsize = gzipSync(content).length;
  const filepath = relative(import.meta.dirname, absolutePath);
  return {
    filename,
    fullpath: filepath,
    relpath: dirname(filepath),
    filesize: formatSize(filesize),
    gzipsize: formatSize(gzipsize),
    mapsize: '',
  };
}
