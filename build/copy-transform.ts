import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { cwd } from 'process';

interface Options {
  from: string;
  to: string;
  transform: (content: string) => string | Promise<string>;
  root?: string;
}

export async function copyTransform({ from, to, transform, root = cwd() }: Options) {
  const manifest = await readFile(resolve(root, from), 'utf-8');
  const transformed = await transform(manifest);
  await writeFile(resolve(root, to), transformed, { encoding: 'utf-8' });
}
