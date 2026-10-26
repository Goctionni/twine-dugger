import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import { ValueEditor } from './ValueEditor';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => ({ ok: true })),
  setStateMulti: vi.fn(async () => []),
}));

afterEach(cleanup);

function setup(path: Path, { compact = false } = {}) {
  const game = createGame({
    flag: true,
    name: 'Ada',
    gold: 3,
    odd: Number.NaN,
    nothing: null,
    when: new Date(2020, 0, 2, 3, 4, 5),
  });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();
  return render(() => <ValueEditor path={path} label={String(path.at(-1))} compact={compact} />);
}

it('has a switch for a boolean, a text field for a string and a number input for a number', () => {
  setup(['flag']);
  expect(screen.getByRole('radio', { name: /true/i })).toBeTruthy();
  cleanup();

  setup(['name']);
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Ada');
  cleanup();

  setup(['gold']);
  expect(screen.getByRole('spinbutton')).toBeTruthy();
});

it('offers a fix for NaN, in the inspector', () => {
  setup(['odd']);
  expect(screen.getByRole('button', { name: /set to 0/i })).toBeTruthy();
});

it('only shows NaN in a row of the grid', () => {
  setup(['odd'], { compact: true });
  expect(screen.queryByRole('button', { name: /set to 0/i })).toBeNull();
  expect(screen.getByText(/NaN/)).toBeTruthy();
});

it('shows a value that has no editor as it is', () => {
  setup(['nothing']);
  expect(screen.getByText('null')).toBeTruthy();
});

it.each([{ compact: false }, { compact: true }])(
  'shows a Date as what it is, without crashing ($compact)',
  (options) => {
    setup(['when'], options);
    expect(screen.getByText('2020-01-02 03:04:05')).toBeTruthy();
  },
);
