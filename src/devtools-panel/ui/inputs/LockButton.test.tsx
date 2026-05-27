/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { LockButton } from './LockButton';

afterEach(() => cleanup());

describe('LockButton', () => {
  it('should render unlock action for locked status', async () => {
    const onToggle = vi.fn<(...args: any[]) => any>();
    const user = userEvent.setup();

    render(() => <LockButton status="locked" onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should render lock action for unlocked status', async () => {
    const onToggle = vi.fn<(...args: any[]) => any>();
    const user = userEvent.setup();

    render(() => <LockButton status="unlocked" onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Lock' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should show ancestor-lock label and no button', () => {
    const onToggle = vi.fn<(...args: any[]) => any>();

    render(() => <LockButton status="ancestor-lock" onToggle={onToggle} />);

    expect(screen.getByText('Ancestor locked')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
