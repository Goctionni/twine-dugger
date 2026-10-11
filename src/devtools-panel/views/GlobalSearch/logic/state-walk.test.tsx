import { render } from '@solidjs/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeObject } from '@/shared/shared-types';

import { startGameState } from '../../../store/game-state';
import { PrettyPath } from '../../../ui/display/PrettyPath';
import { walkState, type StateEntry } from './state-walk';

// The game state store reaches the extension api when it is imported; nothing here calls it
vi.hoisted(() => {
  (globalThis as { chrome?: unknown }).chrome = { devtools: {} };
});

const state: JSONSafeObject = {
  'hp': 5,
  'with space': 1,
  '1st': { 'a-b': true, 'ok_name': 'x' },
  'nested': { deep: { list: [1, { x: 'y' }, ['z']] } },
  'seen': [SET_MARKER, 'cave', { room: 1 }],
  'visits': { [TYPE_KEY]: 'Map', 'home': 4, 'far-away': 1 },
  'counts': { [TYPE_KEY]: 'NumberMap', '12': 'twelve', 'other': 'x' },
};

let stop: (() => void) | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  stop?.();
  host?.remove();
});

const written = (entry: StateEntry) => {
  host = document.createElement('div');
  document.body.append(host);
  stop = render(() => <PrettyPath path={entry.path} />, host);
  const text = host.textContent;
  stop();
  host.remove();
  stop = undefined;
  host = undefined;
  return text;
};

// The search marks matches as positions in `pathText`, and the rows show the path with PrettyPath:
// the two have to write a path the same way, or the marks end up in the wrong place
describe('pathText of the state walk', () => {
  it('is the text that PrettyPath shows for the same path', () => {
    startGameState(state);
    const entries: StateEntry[] = [];
    walkState(state, (entry) => entries.push(entry));
    expect(entries.length).toBeGreaterThan(15);

    const differences = entries
      .map((entry) => ({ path: entry.path, pathText: entry.pathText, shown: written(entry) }))
      .filter((entry) => entry.pathText !== entry.shown);
    expect(differences).toEqual([]);
  });
});
