import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { setSetting } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';

import { MillerColumn } from './MillerColumn';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(cleanup);

function setup(path: (string | number)[] = [], depth = 0) {
  const game = createGame({
    hp: 10,
    name: 'a',
    stats: { str: 1, nested: { a: 1 } },
    inv: [1, 2],
    tags: new Set(['x', 'y']),
    scores: new Map([['ann', 1]]),
  });
  startGameState(game.state());
  flush();

  const { container } = render(() => (
    <MillerColumn depth={depth} path={path} onSelect={() => {}} />
  ));
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => records.push(...batch));
  observer.observe(container, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });

  const rows = () => [...container.querySelectorAll('button')];
  const names = () => rows().map((row) => row.querySelector('span.shrink-0.truncate')!.textContent);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
    observer.takeRecords().forEach((record) => records.push(record));
    return records.splice(0);
  };
  return { container, rows, names, play };
}

describe('MillerColumn', () => {
  it('lists containers first, then primitives by type', () => {
    expect(setup().names()).toEqual(['stats', 'scores', 'inv', 'tags', 'hp', 'name']);
  });

  it('writes nothing for a change deeper than the column, and only the changed text for a value', () => {
    const { rows, play } = setup();
    const before = rows();

    expect(play((s) => (s.stats.nested.a = 2))).toHaveLength(0);

    const records = play((s) => (s.hp = 9));
    expect(records).toHaveLength(1);
    expect(records[0]!.type).toBe('characterData');
    expect(rows()).toEqual(before);
  });

  it('keeps the rows that stay when a key is added', () => {
    const { rows, names, play } = setup();
    const before = rows();

    play((s) => (s.gold = 5));

    expect(names()).toEqual(['stats', 'scores', 'inv', 'tags', 'gold', 'hp', 'name']);
    expect(before.every((row) => rows().includes(row))).toBe(true);
  });

  it('marks the selected row', () => {
    const { rows } = setup(['hp']);
    expect(rows().filter((row) => row.className.includes('border-sky-500'))).toHaveLength(1);
  });
});

describe('markers of the transformed state', () => {
  it('shows a set by position and a map by its keys, without the markers', () => {
    expect(setup(['tags'], 1).names()).toEqual(['0', '1']);
    expect(setup(['scores'], 1).names()).toEqual(['ann']);
  });
});

describe('the toolbar', () => {
  afterEach(() => {
    setSetting('state.filters', []);
    setSetting('state.propertyOrder', 'type');
    flush();
  });

  it('hides the types that are hidden, says how many, and keeps the selected row', () => {
    setSetting('state.filters', ['number', 'string']);
    flush();

    const { names, container } = setup();
    expect(names()).toEqual(['stats', 'scores', 'inv', 'tags']);
    expect(container.textContent).toContain('2 hidden');
    cleanup();

    const selected = setup(['hp']);
    expect(selected.names()).toEqual(['stats', 'scores', 'inv', 'tags', 'hp']);
  });

  it('sorts by name when asked', () => {
    setSetting('state.propertyOrder', 'alphabetic');
    flush();
    expect(setup().names()).toEqual(['hp', 'inv', 'name', 'scores', 'stats', 'tags']);
  });

  it('puts what changed last first', () => {
    setSetting('state.propertyOrder', 'most-recent');
    flush();
    const { names, play } = setup();
    play((s) => (s.name = 'b'));
    play((s) => (s.hp = 9));
    expect(names().slice(0, 2)).toEqual(['hp', 'name']);
  });
});
