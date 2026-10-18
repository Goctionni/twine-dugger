import { cleanup, render } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { setState } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { StringEditor } from './StringEditor';

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
    name: 'Alex',
    story: 'one\ntwo',
    group: { title: 'Mr' },
    alias: 'Alex',
    tags: new Set(['a']),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const [getPath, setPath] = createSignal<Path>(initialPath);
  const view = render(() => <StringEditor path={getPath()} label="Name" />);
  const field = () => view.getByRole<HTMLInputElement | HTMLTextAreaElement>('textbox');
  const lockButton = () => view.queryByRole('button', { name: 'Lock' });
  const saveButton = () => view.queryByRole('button', { name: 'Save' });
  const checkbox = () => view.getByRole<HTMLInputElement>('checkbox', { name: 'Multiline' });

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
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  const goTo = (path: Path) => {
    setPath(path);
    flush();
  };
  return { ...view, field, lockButton, saveButton, checkbox, type, press, play, goTo };
}

it('shows a text in one line, and a text with a line break in the larger field', () => {
  const short = setup(['name']);
  expect(short.field().tagName).toBe('INPUT');
  expect(short.field().value).toBe('Alex');
  expect(short.checkbox().checked).toBe(false);
  cleanup();

  const long = setup(['story']);
  expect(long.field().tagName).toBe('TEXTAREA');
  expect(long.field().value).toBe('one\ntwo');
  expect(long.checkbox().checked).toBe(true);
  // It cannot go back to one line while it has a line break: that would delete it
  expect(long.checkbox().disabled).toBe(true);
});

it('switches the field with the checkbox, and keeps the text', () => {
  const { field, checkbox } = setup(['name']);

  checkbox().click();
  flush();
  expect(field().tagName).toBe('TEXTAREA');
  expect(field().value).toBe('Alex');

  checkbox().click();
  flush();
  expect(field().tagName).toBe('INPUT');
});

it('shows a save button for a change, and Esc takes the change back', () => {
  const { field, lockButton, saveButton, type, press } = setup(['name']);
  expect(lockButton()).not.toBeNull();
  expect(saveButton()).toBeNull();

  type('Bob');
  expect(saveButton()).not.toBeNull();
  expect(lockButton()).toBeNull();

  press('Escape');
  expect(field().value).toBe('Alex');
  expect(saveButton()).toBeNull();
  expect(lockButton()).not.toBeNull();
});

it('saves with Enter, and is done when the game has the value', () => {
  const { field, saveButton, lockButton, type, press, play } = setup(['name']);
  type('Bob');

  press('Enter');
  expect(setState).toHaveBeenCalledWith(['name'], 'Bob');
  expect(saveButton()).not.toBeNull();

  play((live) => (live.name = 'Bob'));
  expect(field().value).toBe('Bob');
  expect(saveButton()).toBeNull();
  expect(lockButton()).not.toBeNull();
});

it('saves with the save button', () => {
  const { saveButton, type } = setup(['name']);
  type('Bob');
  saveButton()!.click();
  expect(setState).toHaveBeenCalledWith(['name'], 'Bob');
});

it('keeps the draft when the game does not take the value, to save again', () => {
  const { field, saveButton, type, press } = setup(['name']);
  type('Bob');
  press('Enter');
  flush();

  expect(field().value).toBe('Bob');
  expect(saveButton()).not.toBeNull();
  press('Enter');
  expect(setState).toHaveBeenCalledTimes(2);
});

it('says why when the value could not be sent, and keeps the draft', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(setState).mockRejectedValueOnce(new Error('no connection'));
  const { field, type, press } = setup(['name']);
  type('Bob');
  press('Enter');
  await Promise.resolve();
  flush();

  expect(error).toHaveBeenCalledWith('Failed to save the value:', expect.any(Error));
  expect(field().value).toBe('Bob');
  error.mockRestore();
});

it('locks and unlocks with Enter when there is nothing to save', () => {
  const { lockButton, press } = setup(['name']);

  press('Enter');
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('true');
  press('Enter');
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('false');
});

it('is read only while it is locked', () => {
  const { field, lockButton } = setup(['name']);
  lockButton()!.click();
  flush();
  expect(field().readOnly).toBe(true);
});

it('uses Ctrl+Enter, not Enter, in the larger field', () => {
  const { type, press } = setup(['story']);
  type('one\ntwo\nthree');

  const plain = press('Enter');
  expect(plain.defaultPrevented).toBe(false);
  expect(setState).not.toHaveBeenCalled();

  const withCtrl = press('Enter', { ctrlKey: true });
  expect(withCtrl.defaultPrevented).toBe(true);
  expect(setState).toHaveBeenCalledWith(['story'], 'one\ntwo\nthree');
});

it('discards a draft, and starts the multiline choice over, for another path', () => {
  const { field, saveButton, checkbox, type, goTo } = setup(['name']);
  checkbox().click();
  flush();
  type('Bob');
  expect(saveButton()).not.toBeNull();

  goTo(['group', 'title']);
  expect(field().value).toBe('Mr');
  expect(field().tagName).toBe('INPUT');
  expect(saveButton()).toBeNull();
});

it('discards a draft for another value that has the same text', () => {
  const { field, saveButton, type, goTo } = setup(['name']);
  type('Bob');
  expect(saveButton()).not.toBeNull();

  goTo(['alias']);
  expect(field().value).toBe('Alex');
  expect(saveButton()).toBeNull();
});

it('keeps a draft when the same path is set again', () => {
  const { field, type, goTo } = setup(['name']);
  type('Bob');
  goTo(['name']);
  expect(field().value).toBe('Bob');
});

it('drops a draft when the game changes the value under it', () => {
  const { field, saveButton, type, play } = setup(['name']);
  type('Bob');

  play((live) => (live.name = 'Carol'));
  expect(field().value).toBe('Carol');
  expect(saveButton()).toBeNull();
});

it('cannot be changed when a parent is locked, and says so', async () => {
  const { field, getByText, lockButton } = setup(['group', 'title']);
  await setPathLock(['group'], true);
  flush();

  expect(field().disabled).toBe(true);
  expect(getByText('Ancestor locked')).toBeTruthy();
  expect(lockButton()).toBeNull();
});

it('cannot be changed in a set', () => {
  const { field } = setup(['tags', 1]);
  expect(field().disabled).toBe(true);
});
