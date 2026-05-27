/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SettingControl } from './SettingControl';

afterEach(() => cleanup());

describe('SettingControl', () => {
  it('should render label wrapper when noLabel is false', () => {
    render(() => (
      <SettingControl label="Font size">
        {(id) => <input id={id} data-testid="control" />}
      </SettingControl>
    ));

    expect(screen.getByText('Font size')).toBeTruthy();
    expect(screen.getByTestId('control')).toBeTruthy();
  });

  it('should render inline span wrapper when noLabel is true', () => {
    render(() => (
      <SettingControl label="Heading Emphasis" noLabel>
        {(id) => <input id={id} data-testid="control" />}
      </SettingControl>
    ));

    expect(screen.getByText('Heading Emphasis')).toBeTruthy();
    expect(screen.getByTestId('control')).toBeTruthy();
  });
});
