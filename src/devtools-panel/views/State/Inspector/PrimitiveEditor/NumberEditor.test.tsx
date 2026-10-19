import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, getLockRange, setLockRange, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { NumberEditor } from './NumberEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.mocked(setState).mockClear();
});

function setup(initialPath: Path) {
  const game = createGame({
    score: 10,
    bonus: 10,
    group: { points: 3 },
    flags: new Set([1]),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const view = render(() => <NumberEditor path={getPath()} label="Score" />);
  const field = () => view.getByRole<HTMLInputElement>('spinbutton', { name: 'Score' });
  const lockButton = () => view.queryByRole('button', { name: 'Lock' });
  const saveButton = () => view.queryByRole('button', { name: 'Save' });

  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input', { bubbles: true }));
    flush();
  };
  const press = (key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    field().dispatchEvent(event);
    flush();
    return event;
  };
  const step = (name: 'Increase' | 'Decrease', init: MouseEventInit = {}) => {
    view
      .getByRole('button', { name })
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    flush();
  };
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  const goTo = (path: Path) => {
    setPath(path);
    flush();
  };
  return { ...view, field, lockButton, saveButton, type, press, step, play, goTo };
}

it('shows the number, with the lock button', () => {
  const { field, lockButton, saveButton } = setup(['score']);
  expect(field().value).toBe('10');
  expect(lockButton()).not.toBeNull();
  expect(saveButton()).toBeNull();
});

it('shows a save button for a change, and Esc takes the change back', () => {
  const { field, lockButton, saveButton, type, press } = setup(['score']);

  type('12');
  expect(saveButton()).not.toBeNull();
  expect(lockButton()).toBeNull();

  press('Escape');
  expect(field().value).toBe('10');
  expect(saveButton()).toBeNull();
});

it('saves with Enter, and is done when the game has the number', () => {
  const { field, saveButton, lockButton, type, press, play } = setup(['score']);
  type('12');

  press('Enter');
  expect(setState).toHaveBeenCalledWith(['score'], 12);
  expect(saveButton()).not.toBeNull();

  play((live) => (live.score = 12));
  expect(field().value).toBe('12');
  expect(saveButton()).toBeNull();
  expect(lockButton()).not.toBeNull();
});

it('only changes the draft with the buttons and the arrow keys: nothing is sent', () => {
  const { field, saveButton, step, press } = setup(['score']);

  step('Increase');
  expect(field().value).toBe('11');
  step('Decrease', { shiftKey: true });
  expect(field().value).toBe('1');
  press('ArrowUp');
  expect(field().value).toBe('2');
  press('ArrowDown', { shiftKey: true });
  expect(field().value).toBe('-8');

  expect(saveButton()).not.toBeNull();
  expect(setState).not.toHaveBeenCalled();

  press('Enter');
  expect(setState).toHaveBeenCalledWith(['score'], -8);
});

it('multiplies and divides the draft by 10 with Ctrl and the arrow keys', () => {
  const { field, press } = setup(['score']);

  press('ArrowUp', { ctrlKey: true });
  expect(field().value).toBe('100');
  press('ArrowDown', { ctrlKey: true });
  press('ArrowDown', { ctrlKey: true });
  expect(field().value).toBe('1');
  expect(setState).not.toHaveBeenCalled();
});

it('does nothing with Enter when the field is not a number', () => {
  const { lockButton, type, press } = setup(['score']);
  type('');

  press('Enter');
  expect(setState).not.toHaveBeenCalled();
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('false');
});

it('locks and unlocks with Enter when there is nothing to save', () => {
  const { lockButton, press } = setup(['score']);

  press('Enter');
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('true');
  press('Enter');
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('false');
});

it('is read only while it is locked, with the same number as both bounds', () => {
  const { field, lockButton, queryByRole, getByRole, press } = setup(['score']);
  lockButton()!.click();
  flush();

  expect(field().readOnly).toBe(true);
  expect(queryByRole('button', { name: 'Increase' })).toBeNull();
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'Score, minimum' }).value).toBe('10');
  expect(getByRole<HTMLInputElement>('spinbutton', { name: 'Score, maximum' }).value).toBe('10');
  press('ArrowUp');
  expect(field().value).toBe('10');
});

it('keeps the draft when the game does not take the number, to save again', () => {
  const { field, saveButton, type, press } = setup(['score']);
  type('12');
  press('Enter');

  expect(field().value).toBe('12');
  expect(saveButton()).not.toBeNull();
  press('Enter');
  expect(setState).toHaveBeenCalledTimes(2);
});

it('says why when the number could not be sent, and keeps the draft', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(setState).mockRejectedValueOnce(new Error('no connection'));
  const { field, type, press } = setup(['score']);
  type('12');
  press('Enter');
  await Promise.resolve();
  flush();

  expect(error).toHaveBeenCalledWith('Failed to save the value:', expect.any(Error));
  expect(field().value).toBe('12');
  error.mockRestore();
});

it('discards a draft for another path, also one that holds the same number', () => {
  const { field, saveButton, type, goTo } = setup(['score']);
  type('12');
  goTo(['bonus']);
  expect(field().value).toBe('10');
  expect(saveButton()).toBeNull();

  type('13');
  goTo(['group', 'points']);
  expect(field().value).toBe('3');
  expect(saveButton()).toBeNull();
});

it('keeps a draft when the same path is set again', () => {
  const { field, type, goTo } = setup(['score']);
  type('12');
  goTo(['score']);
  expect(field().value).toBe('12');
});

it('drops a draft when the game changes the number under it', () => {
  const { field, saveButton, type, play } = setup(['score']);
  type('12');

  play((live) => (live.score = 99));
  expect(field().value).toBe('99');
  expect(saveButton()).toBeNull();
});

it('cannot be changed when a parent is locked, and says so', async () => {
  const { field, getByText, lockButton } = setup(['group', 'points']);
  await setPathLock(['group'], true);
  flush();

  expect(field().disabled).toBe(true);
  expect(getByText('Ancestor locked')).toBeTruthy();
  expect(lockButton()).toBeNull();
});

it('cannot be changed in a set', () => {
  const { field } = setup(['flags', 1]);
  expect(field().disabled).toBe(true);
});

describe('locked to a range', () => {
  const lockWithBounds = async (min: number, max: number) => {
    const view = setup(['score']);
    view.lockButton()!.click();
    flush();
    await setLockRange(['score'], min, max);
    flush();
    const bound = (name: 'minimum' | 'maximum') =>
      view.getByRole<HTMLInputElement>('spinbutton', { name: `Score, ${name}` });
    const commit = (name: 'minimum' | 'maximum', text: string) => {
      bound(name).value = text;
      bound(name).dispatchEvent(new Event('change', { bubbles: true }));
      flush();
    };
    return { ...view, bound, commit };
  };

  it('can be changed inside the range, which holds the stepping and the save', async () => {
    const { field, press, type, saveButton } = await lockWithBounds(5, 12);
    expect(field().readOnly).toBe(false);

    press('ArrowUp', { shiftKey: true });
    expect(field().value).toBe('12');

    type('99');
    press('Enter');
    expect(setState).toHaveBeenCalledWith(['score'], 12);
    expect(saveButton()).not.toBeNull();
  });

  it('writes a bound when it is changed, and pushes the other one along', async () => {
    const { bound, commit } = await lockWithBounds(5, 12);

    commit('maximum', '20');
    expect(bound('maximum').value).toBe('20');
    expect(getLockRange(['score'])).toEqual({ min: 5, max: 20 });

    commit('minimum', '30');
    expect(getLockRange(['score'])).toEqual({ min: 30, max: 30 });
    expect(bound('maximum').value).toBe('30');
  });

  it('steps a bound with the same keys as the number, and writes it when the field is left', async () => {
    const { bound } = await lockWithBounds(5, 12);
    const press = (key: string, init: KeyboardEventInit = {}) => {
      bound('maximum').dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
      );
      flush();
    };

    bound('maximum').focus();
    press('ArrowUp');
    press('ArrowUp', { shiftKey: true });
    expect(bound('maximum').value).toBe('23');
    expect(getLockRange(['score'])).toEqual({ min: 5, max: 12 });

    press('ArrowUp', { ctrlKey: true });
    expect(bound('maximum').value).toBe('230');

    bound('maximum').blur();
    flush();
    expect(getLockRange(['score'])).toEqual({ min: 5, max: 230 });
  });

  it('keeps the bound when what is typed is not a number', async () => {
    const { bound, commit } = await lockWithBounds(5, 12);
    commit('minimum', '');
    expect(bound('minimum').value).toBe('5');
    expect(getLockRange(['score'])).toEqual({ min: 5, max: 12 });
  });

  it('has no bounds again when it is unlocked', async () => {
    const { lockButton, queryByRole } = await lockWithBounds(5, 12);
    lockButton()!.click();
    flush();
    expect(queryByRole('spinbutton', { name: 'Score, minimum' })).toBeNull();
    expect(getLockRange(['score'])).toBeUndefined();
  });
});
