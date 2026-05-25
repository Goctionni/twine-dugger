/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NumberInput } from './NumberInput';

afterEach(() => cleanup());

describe('NumberInput', () => {
  it('should decrement and increment with buttons', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <NumberInput value={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '-' }));
    await user.click(screen.getByRole('button', { name: '+' }));

    expect(onChange).toHaveBeenNthCalledWith(1, 4);
    expect(onChange).toHaveBeenNthCalledWith(2, 6);
  });

  it('should emit typed number value from input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <NumberInput value={1} onChange={onChange} />);

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '42');

    expect(onChange).toHaveBeenCalled();
  });

  it('should disable button interactions when disabled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <NumberInput value={1} onChange={onChange} disabled />);

    await user.click(screen.getByRole('button', { name: '-' }));
    await user.click(screen.getByRole('button', { name: '+' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
