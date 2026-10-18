/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NumberInput } from './NumberInput';

afterEach(() => cleanup());

describe('NumberInput', () => {
  it('should allow entering a negative number after the field is focused', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole<HTMLInputElement>('spinbutton');
    await user.clear(input);
    await user.type(input, '-12');

    expect(onChange).toHaveBeenLastCalledWith(-12);
    expect(input.value).toBe('-12');
  });

  it('should allow entering a leading decimal after the field is focused', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole<HTMLInputElement>('spinbutton');
    await user.clear(input);
    await user.type(input, '.5');

    expect(onChange).toHaveBeenLastCalledWith(0.5);
    expect(input.value).toBe('0.5');
  });

  it('should strip non-numeric text while typing', async () => {
    const onChange = vi.fn<(value: number) => void>();
    const user = userEvent.setup();

    render(() => <NumberInput value={0} onChange={onChange} />);

    const input = screen.getByRole<HTMLInputElement>('spinbutton');
    await user.clear(input);
    await user.type(input, '12abc');

    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(input.value).toBe('12');
  });
});

describe('NumberInput steps', () => {
  const setup = (value = 5) => {
    const onChange = vi.fn<(value: number) => void>();
    render(() => <NumberInput value={value} onChange={onChange} />);
    return { onChange, input: screen.getByRole<HTMLInputElement>('spinbutton') };
  };
  const press = (input: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    input.dispatchEvent(event);
    return event;
  };

  it('adds and subtracts 1 with the buttons, and 10 with Shift', async () => {
    const { onChange } = setup(5);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Increase' }));
    expect(onChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    expect(onChange).toHaveBeenLastCalledWith(15);
    await user.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(onChange).toHaveBeenLastCalledWith(-5);
  });

  it('adds and subtracts 1 with the arrow keys, and 10 with Shift, from what is typed', () => {
    const { onChange, input } = setup(5);

    const up = press(input, 'ArrowUp');
    expect(up.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(6);

    press(input, 'ArrowDown', { shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(-5);

    input.value = '2.5';
    press(input, 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith(3.5);
  });

  it('starts from 0 when the field is empty, and leaves the tail of floating point out', () => {
    const { onChange, input } = setup(5);
    input.value = '';
    press(input, 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith(1);

    input.value = '0.1';
    press(input, 'ArrowUp', { shiftKey: false });
    expect(onChange).toHaveBeenLastCalledWith(1.1);
    input.value = '0.2';
    press(input, 'ArrowDown');
    expect(onChange).toHaveBeenLastCalledWith(-0.8);
  });

  it('leaves other keys, and arrows with Alt, to the one that listens', () => {
    const onKeyDown = vi.fn();
    const onChange = vi.fn();
    render(() => <NumberInput value={1} onChange={onChange} onKeyDown={onKeyDown} />);
    const input = screen.getByRole<HTMLInputElement>('spinbutton');

    press(input, 'Enter');
    press(input, 'ArrowUp', { altKey: true });
    press(input, 'ArrowUp', { ctrlKey: true, shiftKey: true });
    expect(onKeyDown).toHaveBeenCalledTimes(3);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('multiplies by 10 with Ctrl and up, and divides by 10 with Ctrl and down', () => {
    const { onChange, input } = setup(5);

    const up = press(input, 'ArrowUp', { ctrlKey: true });
    expect(up.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(50);

    input.value = '3';
    press(input, 'ArrowDown', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith(0.3);

    input.value = '0.3';
    press(input, 'ArrowUp', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('keeps small numbers and large whole numbers exact when it scales', () => {
    const { onChange, input } = setup(5);

    input.value = '0.0000005';
    press(input, 'ArrowDown', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith(5e-8);

    input.value = '1700000000000';
    press(input, 'ArrowUp', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith(17000000000000);

    input.value = '';
    press(input, 'ArrowUp', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('does not step when it is read only', () => {
    const onChange = vi.fn();
    render(() => <NumberInput value={1} onChange={onChange} readOnly />);
    const input = screen.getByRole<HTMLInputElement>('spinbutton');
    press(input, 'ArrowUp');
    expect(onChange).not.toHaveBeenCalled();
  });
});
