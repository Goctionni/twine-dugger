import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { setSetting, togglePin } from '@/devtools-panel/store/store';
import { createGame } from '@/testing/test-game';

import { MillerColumn } from './MillerColumn';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(() => {
  cleanup();
});

function setup(path: (string | number)[] = [], depth = 0, trail = path) {
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

  const onSelect = vi.fn();
  const { container } = render(() => (
    <MillerColumn treeId="tree" depth={depth} path={path} trail={trail} onSelect={onSelect} />
  ));
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => records.push(...batch));
  observer.observe(container, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });

  const rows = () => [...container.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const names = () => rows().map((row) => row.querySelector('span.shrink-0.truncate')!.textContent);
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
    observer.takeRecords().forEach((record) => records.push(record));
    return records.splice(0);
  };
  return { container, rows, names, play, onSelect };
}

describe('MillerColumn', () => {
  it('lists containers first, then primitives by type', () => {
    expect(setup().names()).toEqual(['stats', 'scores', 'inv', 'tags', 'hp', 'name']);
  });

  it('writes only to the rows that changed, and keeps the rows', () => {
    const { rows, names, play } = setup();
    const before = rows();
    const rowOf = (name: string) => rows()[names().indexOf(name)]!;

    // The dot of the container that holds the change
    const deeper = play((s) => (s.stats.nested.a = 2));
    expect(deeper.every((record) => rowOf('stats').contains(record.target))).toBe(true);
    expect(rowOf('stats').querySelector('[aria-label="Changed recently"]')).not.toBeNull();
    expect(rowOf('hp').querySelector('[aria-label="Changed recently"]')).toBeNull();

    // The text of the value, and its dot
    const records = play((s) => (s.hp = 9));
    expect(records.every((record) => rowOf('hp').contains(record.target))).toBe(true);
    expect(records.filter((record) => record.type === 'characterData')).toHaveLength(1);
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

describe('pins', () => {
  afterEach(() => {
    togglePin(['stats']);
    flush();
  });

  it('puts the pinned rows first, with a star, and the rows that hold a pinned value too', () => {
    togglePin(['stats', 'nested', 'a']);
    flush();
    const root = setup();
    expect(root.names()[0]).toBe('stats');
    const stars = root.rows().filter((row) => row.querySelector('[aria-label="Pinned"]'));
    expect(stars.map((row) => row.textContent?.includes('stats'))).toEqual([true]);
    cleanup();

    const inStats = setup(['stats'], 1);
    expect(inStats.names()).toEqual(['nested', 'str']);
    expect(inStats.rows()[0]!.querySelector('[aria-label="Pinned"]')).not.toBeNull();
    expect(inStats.rows()[1]!.querySelector('[aria-label="Pinned"]')).toBeNull();
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

  it('hides the types that are hidden, and says how many', () => {
    setSetting('state.filters', ['number', 'string']);
    flush();

    const { names, container } = setup();
    expect(names()).toEqual(['stats', 'scores', 'inv', 'tags']);
    expect(container.textContent).toContain('2 hidden');
  });

  it('hides the selected row too when its type is hidden', () => {
    setSetting('state.filters', ['number']);
    flush();

    expect(setup(['hp']).names()).toEqual(['stats', 'scores', 'inv', 'tags', 'name']);
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

describe('selecting', () => {
  it('selects the row that is clicked', () => {
    const { rows, onSelect } = setup(['hp']);
    rows()[1]!.click();
    expect(onSelect).toHaveBeenCalledWith(['scores']);
  });

  it('goes back to the container when the selected row is clicked again', () => {
    const { rows, names, onSelect } = setup(['hp']);
    rows()[names().indexOf('hp')]!.click();
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it('keeps a row that is only on the path selectable', () => {
    const { rows, names, onSelect } = setup(['stats', 'str']);
    rows()[names().indexOf('stats')]!.click();
    expect(onSelect).toHaveBeenCalledWith(['stats']);
  });
});

describe('the trail', () => {
  const states = (names: string[], setupResult: ReturnType<typeof setup>) =>
    Object.fromEntries(
      setupResult.rows().map((row, index) => [names[index], row.dataset.selectionState]),
    );

  it('marks the row of the trail that is not on the path', () => {
    const result = setup(['stats'], 1, ['stats', 'nested']);
    expect(states(result.names() as string[], result)).toEqual({ nested: 'trail', str: 'normal' });
  });

  it('marks the row of the path as on the path, not as the trail', () => {
    const result = setup(['stats', 'nested'], 1, ['stats', 'nested']);
    expect(states(result.names() as string[], result)).toEqual({
      nested: 'selected',
      str: 'normal',
    });
  });
});
