import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/devtools-panel/store/game-state', async () => {
  const { createStore } = await import('solid-js');
  const [state, setState] = createStore<Record<string, unknown>>({
    player: { 'first-name': 'Ada', 'items': [1, 2] },
    seen: { '__twinedugger-type': 'Map', 'tavern': 3 },
    tags: ['__twinedugger-type: Set', 'a', 'b'],
  });
  return { getActiveState: () => state, setMockState: setState };
});

const { PrettyPath } = await import('./PrettyPath');
const { setMockState } = (await import('@/devtools-panel/store/game-state')) as unknown as {
  setMockState: (update: (state: Record<string, unknown>) => void) => void;
};

afterEach(() => cleanup());

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
});
