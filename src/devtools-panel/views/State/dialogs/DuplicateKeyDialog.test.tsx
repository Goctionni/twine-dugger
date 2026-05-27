/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DuplicateKeyDialog } from './DuplicateKeyDialog';

describe('DuplicateKeyDialog', () => {
  afterEach(() => cleanup());

  it('should submit typed key to confirmation handler', () => {
    const onConfirm = vi.fn<(...args: any[]) => any>();
    render(() => <DuplicateKeyDialog onConfirm={onConfirm} />);

    const input = screen.getByRole('textbox');
    const submit = screen.getByRole('button', { name: 'Confirm' });

    fireEvent.input(input, { target: { value: 'inventory-copy' } });
    fireEvent.click(submit);

    expect(onConfirm).toHaveBeenCalledWith('inventory-copy');
  });

  it('should submit empty key when user confirms without typing', () => {
    const onConfirm = vi.fn<(...args: any[]) => any>();
    render(() => <DuplicateKeyDialog onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledWith('');
  });
});
