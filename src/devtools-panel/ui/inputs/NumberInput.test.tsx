/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NumberInput } from './NumberInput';

afterEach(() => {
  cleanup();
});

describe('NumberInput', () => {
  it('should allow entering a negative number after the field is focused', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, '-12');

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(-12);
    expect((input as HTMLInputElement).value).toBe('-12');
  });

  it('should allow entering a leading decimal after the field is focused', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, '.5');

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(0.5);
    expect((input as HTMLInputElement).value).toBe('.5');

    await user.tab();

    expect((input as HTMLInputElement).value).toBe('0.5');
  });

  it('should strip non-numeric text while typing', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, '12abc');

    expect(onChange.mock.calls.at(-1)?.[0]).toBe(12);
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('12');
    });
  });
});
