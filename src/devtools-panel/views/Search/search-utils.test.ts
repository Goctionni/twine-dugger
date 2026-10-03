import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { pretransformState } from '@/content-script/util/pre-transform';
import type { JSONSafeObject, ParsedPassageData, SearchResultState } from '@/shared/shared-types';

import { findPassageMatches, findStateMatches } from './search-utils';

let yields = 0;

// The browser has a scheduler, node doesn't. This one counts how often a search gives way.
beforeEach(() => {
  yields = 0;
  Object.assign(globalThis, {
    scheduler: {
      postTask: (task: () => unknown, options?: { signal?: AbortSignal }) =>
        new Promise((resolve, reject) => {
          queueMicrotask(() => {
            if (options?.signal?.aborted) return reject(new Error('aborted'));
            Promise.resolve(task()).then(resolve, reject);
          });
        }),
      yield: () => {
        yields++;
        return Promise.resolve();
      },
    },
  });
});
afterEach(() => vi.restoreAllMocks());

const makeSearchesYield = () => {
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 10));
};

const toJson = (state: object) => pretransformState(state as never)[0];
const keyOf = (result: SearchResultState) => result.path.join('.');

const search = async (state: JSONSafeObject, query: string) => {
  const [promise] = findStateMatches(state, query);
  return promise;
};

function reference(state: JSONSafeObject, rawQuery: string) {
  const query = rawQuery.toLowerCase();
  const n = Number(rawQuery.trim());
  const found = new Set<string>();
  const walk = (value: any, path: Array<string | number>) => {
    if (!value || typeof value !== 'object') return;
    if (value['__twinedugger-type'] === 'function' || value['__twinedugger-type'] === 'Date')
      return;
    const isSet = Array.isArray(value) && value[0] === '__twinedugger-type: Set';
    for (const key of Object.keys(value)) {
      if (key === '__twinedugger-type' || (isSet && key === '0')) continue;
      const child = value[key];
      const childPath = [...path, Array.isArray(value) ? Number(key) : key];
      const keyMatches = !Array.isArray(value) && key.toLowerCase().includes(query);
      const valueMatches =
        (typeof child === 'string' && child.toLowerCase().includes(query)) ||
        (typeof child === 'number' && Number.isFinite(n) && String(child).includes(String(n))) ||
        (typeof child === 'boolean' &&
          ((query === 'true' && child) || (query === 'false' && !child)));
      if (keyMatches || valueMatches) found.add(childPath.join('.'));
      walk(child, childPath);
    }
  };
  walk(state, []);
  return found;
}

function randomState(seed: number, topLevel = 12) {
  let s = seed;
  const random = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]!;
  const words = ['dragon', 'Castle', 'tavern', 'npc', 'true', 'ab', 'abc', 'x1', 'e5'];
  const primitive = (): unknown =>
    pick<() => unknown>([
      () => pick(words),
      () => `${pick(words)} ${pick(words)}`,
      () => pick([0, 1, 12, 112, 1.5, -5, 15, 100000, 16, 256]),
      () => random() < 0.5,
      () => null,
    ])();
  const make = (depth: number): unknown => {
    if (depth === 0 || random() < 0.3) return primitive();
    const size = 1 + Math.floor(random() * 4);
    const kind = random();
    if (kind < 0.4) {
      return Object.fromEntries(
        Array.from({ length: size }, () => [
          pick(words) + Math.floor(random() * 3),
          make(depth - 1),
        ]),
      );
    }
    if (kind < 0.7) return Array.from({ length: size }, () => make(depth - 1));
    if (kind < 0.85)
      return new Map(Array.from({ length: size }, () => [pick(words), make(depth - 1)]));
    return new Set(Array.from({ length: size }, () => primitive()));
  };
  return toJson(
    Object.fromEntries(Array.from({ length: topLevel }, (_, i) => [`top${i}`, make(3)])),
  );
}

describe('findStateMatches', () => {
  const state = toJson({
    player: { name: 'Ada', hp: 12 },
    tags: new Set(['hero', 'tired']),
    seen: new Map([['tavern', 3]]),
    onHit: () => 'a function with hero in its source',
    list: [{ label: 'hero shield' }],
  });

  it('finds keys and values, in objects, arrays, maps and sets', async () => {
    expect((await search(state, 'hero')).map(keyOf)).toEqual(['tags.1', 'list.0.label']);
    expect((await search(state, 'tavern')).map(keyOf)).toEqual(['seen.tavern']);
    expect((await search(state, '12')).map(keyOf)).toEqual(['player.hp']);
  });

  it('does not match the markers used for Maps, Sets and functions', async () => {
    expect(await search(state, 'twinedugger')).toEqual([]);
    expect(await search(state, 'map')).toEqual([]);
    expect(await search(state, 'function')).toEqual([]);
  });

  it('finds exactly what a plain walk finds, also while giving way to the page all the time', async () => {
    makeSearchesYield();
    for (let seed = 1; seed <= 8; seed++) {
      const random = randomState(seed, 150);
      for (const query of ['abc', 'ab', 'npc', '1', '12', '-5', 'true', 'e5', 'castle']) {
        const results = await search(random, query);
        const found = new Set(results.map(keyOf));
        expect({ seed, query, found }).toEqual({ seed, query, found: reference(random, query) });
        expect({ seed, query, results: results.length }).toEqual({
          seed,
          query,
          results: found.size,
        });
      }
    }
    expect(yields).toBeGreaterThan(100);
  });

  it('stops when aborted', async () => {
    makeSearchesYield();
    const [promise, abort] = findStateMatches(randomState(1), 'a');
    abort();
    expect(await promise.catch(() => [])).toEqual([]);
  });
});

describe('passages', () => {
  const passage = (
    id: number,
    name: string,
    content: string,
    tags: string[] = [],
  ): ParsedPassageData => ({
    id,
    name,
    content,
    tags,
    size: null,
    position: null,
  });
  const passages = [
    passage(1, 'Start', 'You wake up in a Tavern.', ['intro']),
    passage(2, 'Cellar', 'Rats. So many rats.', ['dark']),
    passage(3, 'Tavern', 'A dragon sleeps here.'),
  ];

  it('matches names, tags and text, ignoring case', async () => {
    const find = async (query: string) =>
      (await findPassageMatches(passages, query)[0]).map((p) => p.id);
    expect(await find('tavern')).toEqual([1, 3]);
    expect(await find('DARK')).toEqual([2]);
    expect(await find('dragon')).toEqual([3]);
    expect(await find('zzz')).toEqual([]);
  });
});
