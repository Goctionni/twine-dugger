import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { getStatePath } from '@/devtools-panel/store/state-location';
import { getNavigationPage } from '@/devtools-panel/store/store';
import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';
import { createGame } from '@/testing/test-game';

import type { StateMatcherHit } from '../types';
import { StateDetail } from './StateDetail';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  deleteFromState: vi.fn(async () => {}),
  setState: vi.fn(async () => ({ ok: true })),
  setStateMulti: vi.fn(async () => []),
}));

afterEach(cleanup);

function setup(path: Path, type: StateMatcherHit['type']) {
  const game = createGame({ flag: true, name: 'Ada', group: { a: 1, b: 2 } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const hit: StateMatcherHit = {
    key: pathKey(path),
    path,
    pathText: path.join('.'),
    type,
    value: undefined,
    pathRanges: [],
    valueRanges: [],
  };
  return render(() => <StateDetail hit={hit} />);
}

it('edits a primitive, with its history and info', () => {
  setup(['name'], 'string');

  expect(screen.getByRole('heading').textContent).toBe('name');
  expect(screen.getByRole('button', { name: 'Pin' })).toBeTruthy();
  expect(screen.getByText('History')).toBeTruthy();
  expect(screen.getByText('Info')).toBeTruthy();
});

it('edits a container: its values can be added to, and written as JSON', () => {
  setup(['group'], 'object');

  expect(screen.getByRole('heading').textContent).toBe('group');
  expect(screen.getByRole('button', { name: 'Add property' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit as JSON' })).toBeTruthy();
});

it('says so when the value is no longer in the state', () => {
  setup(['gone'], 'string');

  expect(screen.getByText('This value is no longer in the state.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pin' })).toBeNull();
});

it('shows the value in the State view', () => {
  setup(['group', 'a'], 'number');

  screen.getByRole('button', { name: 'Show in State view' }).click();
  flush();

  expect(getNavigationPage()).toBe('state');
  expect(getStatePath()).toEqual(['group', 'a']);
});
