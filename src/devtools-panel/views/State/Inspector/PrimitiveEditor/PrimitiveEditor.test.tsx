import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import { setState, setStatePropertyLocks } from '@/devtools-panel/api/api';
import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { PrimitiveEditor } from './PrimitiveEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
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
  flush();
});

function setup(path: Path) {
  const game = createGame({
    flag: true,
    group: { on: true },
    flags: new Set([true]),
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
