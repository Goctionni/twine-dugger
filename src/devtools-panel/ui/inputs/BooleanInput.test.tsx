/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { BooleanInput } from './BooleanInput';

afterEach(() => cleanup());

describe('BooleanInput', () => {
  it('should toggle true/false via labels', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <BooleanInput id="bool-a" value={false} onChange={onChange} />);

    await user.click(screen.getByText('True'));
    await user.click(screen.getByText('False'));

    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  it('should not toggle when disabled or readonly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(() => <BooleanInput id="bool-b" value={false} onChange={onChange} disabled />);

    await user.click(screen.getByText('True'));
    cleanup();
    render(() => <BooleanInput id="bool-b" value={false} onChange={onChange} readOnly />);
    await user.click(screen.getByText('False'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
