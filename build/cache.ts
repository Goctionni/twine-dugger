import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { cwd } from 'process';

const cacheLoc = resolve(cwd(), 'node_modules/.wb-temp/_cache.json');

type Cache = Record<string, { timestamp: number; data: string }>;

export async function fromCache(key: string): Promise<string | false> {
  if (!existsSync(cacheLoc)) return false;
  const cacheRaw = await readFile(cacheLoc, 'utf-8');
  if (!cacheRaw) return false;
  const cacheContent = JSON.parse(cacheRaw) as Cache;
  const result = cacheContent[key];
  if (!result || typeof result !== 'object') return false;
  if (Date.now() - result.timestamp > 1000 * 60 * 60) return false;
  return result.data;
}

export async function toCache(url: string, content: string): Promise<void> {
  const timestamp = Date.now();
  if (!existsSync(cacheLoc)) {
    await mkdir(dirname(cacheLoc), { recursive: true });
    await writeFile(cacheLoc, JSON.stringify({ [url]: { data: content, timestamp } }, null, '  '), {
      encoding: 'utf-8',
      flag: 'w',
    });
    return;
  }
  const cacheRaw = await readFile(cacheLoc, 'utf-8');
  const cacheContent = {
    ...JSON.parse(cacheRaw),
    [url]: { data: content, timestamp },
  };
  await writeFile(cacheLoc, JSON.stringify(cacheContent, null, '  '), {
    encoding: 'utf-8',
    flag: 'w',
  });
}
