import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, onTestFinished, vi } from 'vite-plus/test';

import { getSettings, setSetting } from '../store/store';
import { SettingsPage } from './SettingsPage';

vi.mock('@/devtools-panel/api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));

afterEach(cleanup);

const tab = (name: string) => screen.getByRole('tab', { name });

it('has a tab for each section and shows the settings of the chosen one', () => {
  render(() => <SettingsPage />);

  expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual([
    'State page',
    'Diff log',
    'Passages page',
    'Search',
    'Editor',
    'Filtered paths and locks',
  ]);
  expect(tab('State page').getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Pinning a value also pins the containers around it.')).toBeTruthy();
  expect(screen.queryByText('Polling interval')).toBeNull();

  tab('Diff log').click();
  flush();
  expect(screen.getByText('Polling interval')).toBeTruthy();
  expect(screen.queryByText('Pinning a value also pins the containers around it.')).toBeNull();
  tab('State page').click();
  flush();
});

it('moves between the tabs with the arrow keys', () => {
  render(() => <SettingsPage />);
  const list = screen.getByRole('tablist');

  list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  flush();
  expect(tab('Diff log').getAttribute('aria-selected')).toBe('true');
  list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  flush();
  expect(tab('Filtered paths and locks').getAttribute('aria-selected')).toBe('true');
  list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  flush();
  expect(tab('State page').getAttribute('aria-selected')).toBe('true');
});

it('changes what the search remembers with checkboxes', () => {
  onTestFinished(() => setSetting('search.persist.scope', false));
  render(() => <SettingsPage />);
  tab('Search').click();
  flush();

  expect(screen.getByText('Remember for next time:')).toBeTruthy();
  const scope = screen.getByLabelText<HTMLInputElement>(/Search scope/);
  expect(scope.checked).toBe(false);
  scope.click();
  flush();
  expect(getSettings.search.persist.scope()).toBe(true);
  tab('State page').click();
  flush();
});

it('has the choice of where filtered paths are hidden above the two lists', () => {
  onTestFinished(() => setSetting('filteredPaths.hiddenIn', 'diff-log'));
  render(() => <SettingsPage />);
  tab('Filtered paths and locks').click();
  flush();

  screen.getByLabelText('State page').click();
  flush();
  expect(getSettings.filteredPaths.hiddenIn()).toBe('state');
  expect(screen.getByText('Filtered paths:')).toBeTruthy();
  expect(screen.getByText('Locked paths:')).toBeTruthy();
  tab('State page').click();
  flush();
});
