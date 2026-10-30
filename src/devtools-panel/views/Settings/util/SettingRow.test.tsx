import { cleanup, render, screen } from '@solidjs/testing-library';
import { flush } from 'solid-js';
import { afterEach, expect, it, onTestFinished } from 'vite-plus/test';

import { setSetting } from '@/devtools-panel/store/store';

import { SettingRow } from './SettingRow';

afterEach(cleanup);

it('shows what the setting is and does, the control, and the unit under it', () => {
  render(() => (
    <SettingRow
      label="Type-ahead pause"
      description="How long to wait."
      setting="state.typeAheadResetMs"
      unit="milliseconds"
    >
      <input aria-label="the control" />
    </SettingRow>
  ));

  expect(screen.getByText('Type-ahead pause')).toBeTruthy();
  expect(screen.getByText('How long to wait.')).toBeTruthy();
  expect(screen.getByLabelText('the control')).toBeTruthy();
  expect(screen.getByText('milliseconds')).toBeTruthy();
});

it('offers to restore the default only while the setting is not the default, and restores it', () => {
  onTestFinished(() => setSetting('state.typeAheadResetMs', 500));
  render(() => (
    <SettingRow label="Type-ahead pause" description="..." setting="state.typeAheadResetMs">
      <input />
    </SettingRow>
  ));
  expect(screen.queryByRole('button', { name: /Restore default/ })).toBeNull();

  setSetting('state.typeAheadResetMs', 900);
  flush();
  const restore = screen.getByRole('button', { name: /Restore default/ });
  expect(restore.title).toBe('Default: 500');

  restore.click();
  flush();
  expect(screen.queryByRole('button', { name: /Restore default/ })).toBeNull();
});

it('writes the default of true / false and of a choice as words', () => {
  onTestFinished(() => setSetting('state.pinCascade', true));
  setSetting('state.pinCascade', false);
  flush();
  render(() => (
    <SettingRow label="Pin parent containers" description="..." setting="state.pinCascade">
      <input />
    </SettingRow>
  ));
  expect(screen.getByRole('button', { name: /Restore default/ }).title).toBe('Default: True');
});

it('has an info button only when there is something to explain', () => {
  const { unmount } = render(() => (
    <SettingRow label="A" description="..." info={{ title: 'About A', children: <p>More.</p> }}>
      <input />
    </SettingRow>
  ));
  expect(screen.getByRole('button', { name: 'About About A' })).toBeTruthy();
  unmount();

  render(() => (
    <SettingRow label="B" description="...">
      <input />
    </SettingRow>
  ));
  expect(screen.queryByRole('button', { name: /About/ })).toBeNull();
});
