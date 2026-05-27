import { beforeEach, describe, expect, it } from 'vite-plus/test';

import { findPassageMatches, findStateMatches } from './search-utils';

describe('findPassageMatches', () => {
  beforeEach(() => {
    (globalThis as any).scheduler = {
      postTask: (task: () => Promise<unknown>) =>
        new Promise((resolve, reject) => {
          queueMicrotask(() => {
            task().then(resolve).catch(reject);
          });
        }),
      yield: () => Promise.resolve(),
    };
  });

  it('should match passages by name, tags, and content case-insensitively', async () => {
    const passages = [
      {
        id: 1,
        name: 'Start',
        tags: ['Intro', 'SafeZone'],
        content: 'Welcome',
        size: null,
        position: null,
      },
      {
        id: 2,
        name: 'Forest',
        tags: ['Danger'],
        content: 'There is a potion here.',
        size: null,
        position: null,
      },
    ];

    const [promise] = findPassageMatches(passages, 'pot');
    const result = await promise;

    expect(result.map((p) => p.id)).toStrictEqual([2]);

    const [tagPromise] = findPassageMatches(passages, 'intro');
    expect((await tagPromise).map((p) => p.id)).toStrictEqual([1]);

    const [namePromise] = findPassageMatches(passages, 'sta');
    expect((await namePromise).map((p) => p.id)).toStrictEqual([1]);
  });

  it('should match passage when any single tag matches query', async () => {
    const passages = [
      {
        id: 3,
        name: 'Camp',
        tags: ['intro', 'danger'],
        content: 'Rest',
        size: null,
        position: null,
      },
    ];

    const [promise] = findPassageMatches(passages, 'intro');
    expect((await promise).map((p) => p.id)).toStrictEqual([3]);
  });

  it('should return empty result when aborted before execution', async () => {
    const [promise, abort] = findPassageMatches(
      [{ id: 1, name: 'A', tags: [], content: 'x', size: null, position: null }],
      'a',
    );
    abort('cancel');

    expect(await promise).toStrictEqual([]);
  });
});

describe('findStateMatches', () => {
  beforeEach(() => {
    (globalThis as any).scheduler = {
      postTask: (task: () => Promise<unknown>) => Promise.resolve().then(task),
      yield: () => Promise.resolve(),
    };
  });

  it('should find full matches before partial matches across structures', async () => {
    const state = {
      player: {
        name: 'Alice',
        hp: 10,
        alive: true,
      },
      inventory: [{ name: 'Potion' }],
      mapData: new Map<string, unknown>([
        ['score', 100],
        ['note', 'portal'],
      ]),
      flags: new Set(['alpha']),
    } as any;
    state.self = state;

    const [promise] = findStateMatches(state, '10');
    const matches = await promise;

    expect(matches.map((m) => m.path)).toStrictEqual([
      ['player', 'hp'],
      ['mapData', 'score'],
    ]);

    const [boolPromise] = findStateMatches(state, 'true');
    const boolMatches = await boolPromise;
    expect(boolMatches.map((m) => m.path)).toStrictEqual([['player', 'alive']]);

    const [falsePromise] = findStateMatches({ feature: { enabled: false } } as any, 'false');
    const falseMatches = await falsePromise;
    expect(falseMatches.map((m) => m.path)).toStrictEqual([['feature', 'enabled']]);
  });

  it('should match map keys and string values with full then partial ordering', async () => {
    const state = {
      mapData: new Map<string, unknown>([
        ['score', 100],
        ['scoreExtra', 'scored'],
      ]),
    } as any;

    const [promise] = findStateMatches(state, 'score');
    const matches = await promise;
    expect(matches.map((m) => m.path)).toStrictEqual([
      ['mapData', 'score'],
      ['mapData', 'scoreExtra'],
    ]);
  });

  it('should not match numeric values when query is non-numeric', async () => {
    const [promise] = findStateMatches({ count: 123 } as any, 'abc');
    const matches = await promise;

    expect(matches).toStrictEqual([]);
  });

  it('should dedupe duplicate key and value matches on the same path', async () => {
    const [promise] = findStateMatches({ foo: 'foo' }, 'foo');
    const matches = await promise;

    expect(matches).toHaveLength(1);
    expect(matches[0]?.path).toStrictEqual(['foo']);
  });

  it('should return empty result when search is aborted', async () => {
    const [promise, abort] = findStateMatches({ player: { name: 'Alice' } }, 'ali');
    abort();

    expect(await promise).toStrictEqual([]);
  });
});
