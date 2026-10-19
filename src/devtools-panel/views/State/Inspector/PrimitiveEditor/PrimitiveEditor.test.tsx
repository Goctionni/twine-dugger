import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState, setState, setStatePropertyLocks } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks } from '@/devtools-panel/store/locks';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { confirmDelete } from './confirmDelete';
import { PrimitiveEditor } from './PrimitiveEditor';

vi.mock('./confirmDelete', () => ({ confirmDelete: vi.fn(async () => true) }));

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
}));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(async () => {
  cleanup();
  await clearLocks();
  vi.useRealTimers();
  vi.mocked(setState).mockClear();
  vi.mocked(setStatePropertyLocks).mockClear();
  vi.mocked(deleteFromState).mockClear();
  vi.mocked(confirmDelete).mockClear();
  if (isPinned(['flag'])) togglePin(['flag']);
  flush();
});

function setup(path: Path) {
  const game = createGame({
    flag: true,
    group: { on: true },
    flags: new Set([true]),
    list: [5, 6],
    n: 3,
    nothing: null,
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const view = render(() => <PrimitiveEditor path={path} onSelect={() => {}} />);
  const radios = () => view.getAllByRole<HTMLInputElement>('radio');
  const checked = () => radios().map((radio) => radio.checked);
  const lockButton = () => view.queryByRole('button', { name: 'Lock' });
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  return { ...view, radios, checked, lockButton, play };
}

it('names the value in a header', () => {
  const { getByRole } = setup(['group', 'on']);
  expect(getByRole('heading').textContent).toBe('on');
});

it('shows a click at once, sends it, and keeps it when the game has it', async () => {
  const { radios, checked, play } = setup(['flag']);
  expect(checked()).toEqual([true, false]);

  radios()[1]!.click();
  flush();
  expect(checked()).toEqual([false, true]);
  expect(setState).toHaveBeenCalledWith(['flag'], false);

  play((live) => (live.flag = false));
  await vi.advanceTimersByTimeAsync(0);
  flush();
  expect(checked()).toEqual([false, true]);
});

it('ignores a second click while the first value waits for the game', async () => {
  const { radios, checked, play } = setup(['flag']);

  radios()[1]!.click();
  flush();
  radios()[0]!.click();
  flush();
  expect(setState).toHaveBeenCalledTimes(1);
  expect(checked()).toEqual([false, true]);

  play((live) => (live.flag = false));
  await vi.advanceTimersByTimeAsync(0);
  flush();
  radios()[0]!.click();
  flush();
  expect(setState).toHaveBeenCalledTimes(2);
  expect(setState).toHaveBeenLastCalledWith(['flag'], true);
});

it('goes back when the game does not take the value', async () => {
  const { radios, checked } = setup(['flag']);

  radios()[1]!.click();
  flush();
  expect(checked()).toEqual([false, true]);

  await vi.advanceTimersByTimeAsync(1300);
  flush();
  expect(checked()).toEqual([true, false]);
});

it('locks the value, which can then be focused but not changed', () => {
  const { radios, checked, lockButton } = setup(['flag']);

  lockButton()!.click();
  flush();
  expect(setStatePropertyLocks).toHaveBeenCalledWith([{ path: ['flag'], value: true }]);
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('true');

  radios()[1]!.click();
  flush();
  expect(setState).not.toHaveBeenCalled();
  expect(checked()).toEqual([true, false]);
  radios()[0]!.focus();
  expect(document.activeElement).toBe(radios()[0]);

  lockButton()!.click();
  flush();
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('false');
});

it('locks and unlocks with Enter on the value', () => {
  const { radios, lockButton } = setup(['flag']);

  radios()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  flush();
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('true');

  radios()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  flush();
  expect(lockButton()!.getAttribute('aria-pressed')).toBe('false');
});

it('cannot be changed when a parent is locked, and says so', async () => {
  const { radios, getByText, lockButton } = setup(['group', 'on']);
  const { setPathLock } = await import('@/devtools-panel/store/locks');
  await setPathLock(['group'], true);
  flush();

  expect(getByText('Ancestor locked')).toBeTruthy();
  expect(lockButton()).toBeNull();
  expect(radios().every((radio) => radio.matches(':disabled'))).toBe(true);
});

it('cannot be changed in a set', () => {
  const { radios } = setup(['flags', 1]);
  expect(radios().every((radio) => radio.matches(':disabled'))).toBe(true);
});

it('shows the value of a type that has no editor yet', () => {
  const { queryAllByRole, getByText } = setup(['nothing']);
  expect(queryAllByRole('radio')).toHaveLength(0);
  expect(queryAllByRole('textbox')).toHaveLength(0);
  // The Info tab shows it too, as JSON in a code element
  expect(getByText('null', { selector: ':not(code)' })).toBeTruthy();
});

it('pins and unpins the value', () => {
  const { getByRole } = setup(['flag']);
  const pin = () => getByRole('button', { name: 'Pin' });
  expect(pin().getAttribute('aria-pressed')).toBe('false');

  pin().click();
  flush();
  expect(isPinned(['flag'])).toBe(true);
  expect(pin().getAttribute('aria-pressed')).toBe('true');

  pin().click();
  flush();
  expect(isPinned(['flag'])).toBe(false);
});

it('deletes the value once it is confirmed, and not when it is not', async () => {
  const { getByRole } = setup(['group', 'on']);
  const remove = () => getByRole('button', { name: 'Delete' });

  vi.mocked(confirmDelete).mockResolvedValueOnce(false);
  remove().click();
  await vi.advanceTimersByTimeAsync(0);
  expect(deleteFromState).not.toHaveBeenCalled();

  remove().click();
  await vi.advanceTimersByTimeAsync(0);
  expect(confirmDelete).toHaveBeenLastCalledWith('on', false);
  expect(deleteFromState).toHaveBeenCalledWith(['group', 'on']);
});

it('says that the items after an array item move up', async () => {
  const { getByRole } = setup(['list', 0]);
  getByRole('button', { name: 'Delete' }).click();
  await vi.advanceTimersByTimeAsync(0);
  expect(confirmDelete).toHaveBeenLastCalledWith('0', true);
});

it('cannot delete a value that is locked, locked by a parent, or in a set', async () => {
  const { setPathLock } = await import('@/devtools-panel/store/locks');
  const { getByRole, unmount } = setup(['flag']);
  const remove = () => getByRole('button', { name: 'Delete' }) as HTMLButtonElement;
  expect(remove().disabled).toBe(false);

  await setPathLock(['flag'], true);
  flush();
  expect(remove().disabled).toBe(true);
  unmount();

  const inGroup = setup(['group', 'on']);
  await setPathLock(['group'], true);
  flush();
  expect((inGroup.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  inGroup.unmount();

  const inSet = setup(['flags', 1]);
  expect((inSet.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true);
});
