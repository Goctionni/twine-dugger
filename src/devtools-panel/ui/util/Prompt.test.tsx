/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('./Dialog', () => ({
  Dialog: (props: { heading?: string; children: JSX.Element; onClose?: () => void }) => (
    <div data-testid="mock-dialog">
      <h2>{props.heading}</h2>
      <button onClick={() => props.onClose?.()}>close-dialog</button>
      <div>{props.children}</div>
    </div>
  ),
}));

import { PromptDialogOutlet, showPromptDialog } from './Prompt';

describe('Prompt', () => {
  afterEach(() => cleanup());

  it('should resolve prompt promise and close outlet', async () => {
    render(() => <PromptDialogOutlet />);

    const promise = showPromptDialog<string>('Rename key', (resolve) => (
      <button onClick={() => resolve('new-key')}>resolve-prompt</button>
    ));

    expect(await screen.findByText('Rename key')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'resolve-prompt' }));

    await expect(promise).resolves.toBe('new-key');
    await waitFor(() => {
      expect(screen.queryByTestId('mock-dialog')).toBeNull();
    });
  });

  it('should reject prompt promise when dialog closes', async () => {
    render(() => <PromptDialogOutlet />);

    const promise = showPromptDialog<string>('Rename key', (resolve) => (
      <button onClick={() => resolve('new-key')}>resolve-prompt</button>
    ));

    expect(await screen.findByText('Rename key')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    await expect(promise).rejects.toBeUndefined();
    await waitFor(() => {
      expect(screen.queryByTestId('mock-dialog')).toBeNull();
    });
  });
});
