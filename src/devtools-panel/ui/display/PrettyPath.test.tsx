import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import * as gameState from '@/devtools-panel/store/game-state';

import { installFakeHighlights, getMarkedText } from '../util/test-highlights';
import { PrettyPath } from './PrettyPath';

vi.mock('@/devtools-panel/store/game-state', async () => {
  const { createStore } = await import('solid-js');
  const initialState = (): Record<string, unknown> => ({
    player: { 'first-name': 'Ada', 'items': [1, 2] },
    seen: { '__twinedugger-type': 'Map', 'tavern': 3, '1': 'one' },
    counts: { '__twinedugger-type': 'NumberMap', '1': 'one', 'other': 2 },
    tags: ['__twinedugger-type: Set', 'a', 'b'],
  });
  const [state, setState] = createStore(initialState());
  const resetMockState = () => {
    setState((draft) => {
      for (const key of Object.keys(draft)) delete draft[key];
      Object.assign(draft, initialState());
    });
  };
  return { getActiveState: () => state, setMockState: setState, resetMockState };
});

const { setMockState, resetMockState } = gameState as unknown as {
  setMockState: (update: (state: Record<string, unknown>) => void) => void;
  resetMockState: () => void;
};

afterEach(() => {
  cleanup();
  resetMockState();
  flush();
});

const written = (path: Array<string | number>) => {
  const { container } = render(() => <PrettyPath path={path} />);
  return container.textContent;
};

describe('PrettyPath', () => {
  it('writes objects with dots or brackets, and arrays with brackets', () => {
    expect(written(['player', 'items', 1])).toBe('player.items[1]');
    expect(written(['player', 'first-name'])).toBe('player["first-name"]');
  });

  it('writes the items of a Map with get, and a Set by the position of the item', () => {
    expect(written(['seen', 'tavern'])).toBe('seen.get("tavern")');
    expect(written(['tags', 2])).toBe('tags[1]');
  });

  it('writes the keys of a map that has number keys as numbers, and the others as text', () => {
    expect(written(['counts', '1'])).toBe('counts.get(1)');
    expect(written(['counts', 'other'])).toBe('counts.get("other")');
    expect(written(['seen', '1'])).toBe('seen.get("1")');
  });

  it('writes a path that is not in the state (anymore) the way its segments suggest', () => {
    expect(written(['gone', 'list', 0, 'name'])).toBe('gone.list[0].name');
  });

  it('keeps writing a path the same when the state changes after it was made', () => {
    const { container } = render(() => <PrettyPath path={['seen', 'tavern']} />);
    expect(container.textContent).toBe('seen.get("tavern")');

    setMockState((state) => {
      delete state.seen;
    });
    flush();
    expect(container.textContent).toBe('seen.get("tavern")');
  });

  it('marks the ranges it is given as a search match, in the text as it is written', () => {
    installFakeHighlights();

    render(() => <PrettyPath path={['player', 'items', 1]} ranges={[[7, 12]]} />);
    flush();
    expect(getMarkedText()).toEqual(['items']);
  });
});
