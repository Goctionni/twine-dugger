import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { SaveButton } from './SaveButton';

afterEach(() => {
  cleanup();
});

describe('SaveButton', () => {
  it('renders save label', () => {
    render(() => <SaveButton onClick={() => {}} />);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeTruthy();
  });

  it('calls onClick when enabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(() => <SaveButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(() => <SaveButton onClick={onClick} disabled />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
