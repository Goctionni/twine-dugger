import { beforeAll, describe, expect, it } from 'vite-plus/test';

import { pretransformState } from '@/content-script/util/pre-transform';

import { findStateMatches } from './search-utils';

// The browser has a scheduler, node doesn't
beforeAll(() => {
  Object.assign(globalThis, {
    scheduler: {
      postTask: (task: () => unknown) => Promise.resolve(task()),
      yield: async () => {},
    },
  });
});

const search = async (state: object, query: string) => {
  const [json] = pretransformState(state as never);
  const [promise] = findStateMatches(json, query);
  return (await promise).map((result) => result.path.join('.'));
};

describe('findStateMatches', () => {
  const state = {
    player: { name: 'Ada', hp: 12 },
    tags: new Set(['hero', 'tired']),
    seen: new Map([['tavern', 3]]),
    onHit: () => 'a function with hero in its source',
    list: [{ label: 'hero shield' }],
  };

  it('finds keys and values, in objects, arrays, maps and sets', async () => {
    expect(await search(state, 'hero')).toEqual(['tags.1', 'list.0.label']);
    expect(await search(state, 'tavern')).toEqual(['seen.tavern']);
    expect(await search(state, '12')).toEqual(['player.hp']);
  });

  it('does not match the markers used for Maps, Sets and functions', async () => {
    expect(await search(state, 'twinedugger')).toEqual([]);
    expect(await search(state, 'map')).toEqual([]);
    expect(await search(state, 'function')).toEqual([]);
  });
});
