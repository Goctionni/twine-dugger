import { create as createDiffer } from 'jsondiffpatch';
import { createEffect, createRoot, flush } from 'solid-js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { pretransformState } from '@/content-script/util/pre-transform';
import { getObjectId, setupIdentityHasher } from '@/shared/id-helper';
import type { JSONSafeObject } from '@/shared/shared-types';

vi.mock('../api/api', () => ({ getPassageData: async () => [] }));

const store = await import('./store');

/** Mimics the content script: diffs live state against the previous poll */
function createGame(live: Record<string, any>) {
  const { getObjectHash, setIdentitySources } = setupIdentityHasher();
  const differ = createDiffer({
    objectHash: (item, index) => getObjectHash(item) ?? getObjectId(item) ?? `$$index:${index}`,
    arrays: { detectMove: true, includeValueOnMove: false },
  });
  let [old, , oldLookup] = pretransformState(live);
  const poll = () => {
    const [next, , nextLookup] = pretransformState(live);
    setIdentitySources({ oldIdentityLookup: oldLookup, newIdentityLookup: nextLookup });
    const delta = differ.diff(old, next);
    old = next;
    oldLookup = nextLookup;
    return { passage: 'P', delta };
  };
  return { live, initial: () => structuredClone(pretransformState(live)[0]), poll };
}

const plain = () => structuredClone(JSON.parse(JSON.stringify(store.getActiveState())));

describe('store', () => {
  it('applies deltas, builds change lists and history slices', () => {
    const game = createGame({
      hp: 10,
      name: 'a',
      inv: [{ item: 'sword' }, { item: 'shield' }],
      ids: [{ id: 1 }, { id: 2 }, { id: 3 }],
      map: new Map([['x', 1]]),
      set: new Set([1, 2]),
    });
    store.resetGameState(game.initial());

    const step = (mutate: (s: any) => void) => {
      mutate(game.live);
      store.applyUpdate(game.poll());
      flush();
    };

    step((s) => (s.hp = 9));
    step((s) => (s.inv[1].item = 'bow'));
    step((s) => s.inv.push({ item: 'potion' }));
    step((s) => s.ids.reverse());
    step((s) => {
      s.map.set('y', 2);
      s.set.add(3);
      s.name = 5;
    });
    step((s) => delete s.hp);

    const expected = JSON.parse(JSON.stringify(pretransformStateJson(game.live)));
    expect(plain()).toEqual(expected);

    const frames = store.getDiffFrames();
    expect(frames.map((f) => f.id)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(frames.map((f) => f.changes.map((c) => `${c.kind}:${c.path.join('.')}`).sort())).toEqual(
      [
        ['del:hp'],
        ['add:map.y', 'add:set.3', 'typ:name'].sort(),
        ['mov:ids'],
        ['add:inv.2'],
        ['chg:inv.1.item'],
        ['chg:hp'],
      ],
    );
    expect(frames[1]!.changes.find((c) => c.path[0] === 'map')!.kinds).toEqual(['object', 'map']);

    // History: slice 1 is the state before the last frame
    store.setViewState('state', 'historyRef', 5);
    flush();
    expect((store.getActiveState() as any).hp).toBe(9);
    store.setViewState('state', 'historyRef', 0);
    flush();
    expect((store.getActiveState() as any).hp).toBe(10);
    expect((store.getActiveState() as any).inv).toHaveLength(2);
    store.setViewState('state', 'historyRef', 'latest');
    flush();
    expect(store.getHistoryIds()).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it('only notifies readers of the properties that changed', () => {
    const game = createGame({ a: 1, b: 2, list: [{ n: 1 }, { n: 2 }, { n: 3 }] });
    store.resetGameState(game.initial());
    flush();

    const runs = { a: 0, b: 0, n1: 0, len: 0 };
    const state = () => store.getActiveState() as any;
    createRoot(() => {
      for (const [name, read] of Object.entries({
        a: () => state().a,
        b: () => state().b,
        n1: () => state().list[1].n,
        len: () => state().list.length,
      })) {
        createEffect(read, () => {
          runs[name as keyof typeof runs]++;
        });
      }
    });
    flush();
    const base = { ...runs };

    game.live.b = 20;
    store.applyUpdate(game.poll());
    flush();
    expect(runs).toEqual({ ...base, b: base.b + 1 });

    game.live.list[1].n = 22;
    store.applyUpdate(game.poll());
    flush();
    expect(runs).toEqual({ ...base, b: base.b + 1, n1: base.n1 + 1 });

    game.live.list.push({ n: 4 });
    store.applyUpdate(game.poll());
    flush();
    expect(runs).toEqual({ ...base, b: base.b + 1, n1: base.n1 + 1, len: base.len + 1 });
  });

  it('keeps the same proxies for array items that only moved', () => {
    const game = createGame({
      list: [
        { id: 1, n: 1 },
        { id: 2, n: 2 },
      ],
    });
    store.resetGameState(game.initial());
    flush();
    const before = (store.getActiveState() as any).list[1];
    game.live.list.reverse();
    store.applyUpdate(game.poll());
    flush();
    const after = (store.getActiveState() as any).list[0];
    expect(after.id).toBe(2);
    expect(after).toBe(before);
  });
});

function pretransformStateJson(live: any): JSONSafeObject {
  return pretransformState(live)[0];
}
