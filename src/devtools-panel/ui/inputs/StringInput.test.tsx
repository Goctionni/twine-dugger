/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { StringInput } from './StringInput';

afterEach(() => cleanup());

describe('StringInput', () => {
  it('should emit typed text on input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <StringInput value="" onChange={onChange} placeholder="Type..." />);

    await user.type(screen.getByPlaceholderText('Type...'), 'abc');

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe('abc');
  });

  it('should call onKeyDown when key pressed', async () => {
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    const user = userEvent.setup();

    render(() => <StringInput value="" onChange={onChange} onKeyDown={onKeyDown} />);

    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('should focus input when autoFocus is true', () => {
    const onChange = vi.fn();

    render(() => <StringInput value="" onChange={onChange} autoFocus />);

    expect(document.activeElement).toBe(screen.getByRole('textbox'));
  });
});
