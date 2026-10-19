import { cleanup, render } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { applyUpdate, startGameState } from '@/devtools-panel/store/game-state';
import { clearLocks, setPathLock } from '@/devtools-panel/store/locks';
import { createGame } from '@/devtools-panel/store/test-game';
import type { Path } from '@/shared/shared-types';

import { ValueTabs } from './ValueTabs';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: vi.fn(async () => {}),
  setState: vi.fn(async () => {}),
}));

afterEach(async () => {
  cleanup();
  await clearLocks();
});

function setup(path: Path) {
  const game = createGame({ score: 10, name: 'Alex', other: 1, group: { on: true, title: 'x' } });
  startGameState(game.state());
  applyUpdate(game.update());
  flush();

  const onSelect = vi.fn();
  const view = render(() => <ValueTabs path={path} onSelect={onSelect} />);
  const historyTab = () => view.getByText('History', { selector: 'summary' });
  const infoTab = () => view.getByText('Info', { selector: 'summary' });
  const isOpen = (tab: HTMLElement) => (tab.parentElement as HTMLDetailsElement).open;
  // The browser opens the tab, and tells with an event a moment later
  const choose = async (tab: HTMLElement) => {
    tab.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    flush();
  };
  const play = (mutate: (live: any) => void) => {
    mutate(game.live);
    applyUpdate(game.update());
    flush();
  };
  const row = (name: string) =>
    view.getByText(name, { selector: 'dt' }).nextElementSibling!.textContent;
  return { ...view, historyTab, infoTab, isOpen, choose, play, onSelect, row };
}

it('has History open to begin with, and the tabs share a name', async () => {
  const { historyTab, infoTab, isOpen, choose } = setup(['score']);
  await choose(historyTab());

  expect(isOpen(historyTab())).toBe(true);
  expect(isOpen(infoTab())).toBe(false);
  const names = [historyTab(), infoTab()].map(
    (tab) => (tab.parentElement as HTMLDetailsElement).name,
  );
  expect(names[0]).not.toBe('');
  expect(names[0]).toBe(names[1]);
});

it('opens the Info tab when its title is clicked', async () => {
  const { infoTab, isOpen, choose } = setup(['score']);
  await choose(infoTab());

  expect(isOpen(infoTab())).toBe(true);
});

it('does not close the tab that is open when its own title is clicked', async () => {
  const { historyTab, isOpen } = setup(['score']);
  const click = new MouseEvent('click', { bubbles: true, cancelable: true });
  historyTab().dispatchEvent(click);
  await new Promise((resolve) => setTimeout(resolve, 0));
  flush();

  expect(click.defaultPrevented).toBe(true);
  expect(isOpen(historyTab())).toBe(true);
});

it('describes a number on the Info tab', async () => {
  const { infoTab, row, choose } = setup(['score']);
  await choose(infoTab());

  expect(row('Type')).toBe('number · integer');
  expect(row('As JSON')).toBe('10');
  expect(row('In')).toContain('State');
  expect(row('In')).toMatch(/· \d+ of \d+/);
  expect(row('Locked')).toBe('no');
});

it('describes the length of a text on the Info tab', async () => {
  const { infoTab, row, choose } = setup(['name']);
  await choose(infoTab());

  expect(row('Type')).toBe('string');
  expect(row('Length')).toBe('4 characters · 1 line');
  expect(row('As JSON')).toBe('"Alex"');
});

it('says how many updates ago the value changed', async () => {
  const { infoTab, row, play, choose } = setup(['score']);
  await choose(infoTab());
  expect(row('Last change')).toBe('none seen since the panel opened');

  play((live) => (live.score = 11));
  expect(row('Last change')).toBe('in the latest update');
  play((live) => (live.other = 2));
  expect(row('Last change')).toBe('1 update ago');
  play((live) => (live.other = 3));
  expect(row('Last change')).toBe('2 updates ago');
});

it('selects the parent from the Info tab', async () => {
  const { infoTab, getByRole, onSelect, row, choose } = setup(['group', 'on']);
  await choose(infoTab());
  expect(row('In')).toBe('group · 1 of 2');

  getByRole('button', { name: 'group' }).click();
  expect(onSelect).toHaveBeenCalledWith(['group']);
});

it('says whether the value is locked, and by which parent', async () => {
  const { infoTab, row, choose } = setup(['group', 'title']);
  await choose(infoTab());

  await setPathLock(['group'], true);
  flush();
  expect(row('Locked')).toBe('via group');

  await setPathLock(['group', 'title'], true);
  flush();
  expect(row('Locked')).toBe('yes');
});

it('counts the changes and the range of a number on the Info tab', async () => {
  const { infoTab, row, play, choose } = setup(['score']);
  await choose(infoTab());
  expect(row('Changes seen')).toBe('0');

  play((live) => (live.score = 14));
  play((live) => (live.score = 8));
  expect(row('Changes seen')).toBe('2');
  expect(row('Range seen')).toBe('8 – 14');
});
