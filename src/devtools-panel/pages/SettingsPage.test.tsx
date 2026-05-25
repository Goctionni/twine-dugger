/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../views/Settings/DiffLogSettings', () => ({
  DiffLogSettings: () => <div data-testid="diff-log-settings" />,
}));

vi.mock('../views/Settings/FilteredPathsSettings', () => ({
  FilteredPathsSettings: () => <div data-testid="filtered-paths-settings" />,
}));

vi.mock('../views/Settings/LockSettings', () => ({
  LockSettings: () => <div data-testid="lock-settings" />,
}));

import { SettingsPage } from './SettingsPage';

afterEach(() => cleanup());

describe('SettingsPage', () => {
  it('should render settings headings and section components', () => {
    render(() => <SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByText('Diff Log')).toBeTruthy();
    expect(screen.getByText('Filtered Paths')).toBeTruthy();
    expect(screen.getByText('Locked Variables')).toBeTruthy();
    expect(screen.getByTestId('diff-log-settings')).toBeTruthy();
    expect(screen.getByTestId('filtered-paths-settings')).toBeTruthy();
    expect(screen.getByTestId('lock-settings')).toBeTruthy();
  });
});
