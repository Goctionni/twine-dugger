/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ContextMenuUI, createContextMenuHandler } from './ContextMenu';

afterEach(() => cleanup());

describe('ContextMenu', () => {
  it('should open menu and run item callback when clicked', () => {
    const onClick = vi.fn();
    const handler = createContextMenuHandler([
      {
        label: 'Filter path',
        onClick,
      },
    ]);

    render(() => (
      <>
        <div data-testid="target" onContextMenu={handler}>
          target
        </div>
        <ContextMenuUI />
      </>
    ));

    fireEvent.contextMenu(screen.getByTestId('target'), { clientX: 50, clientY: 70 });
    const button = screen.getByRole('button', { name: 'Filter path' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Filter path' })).toBeNull();
  });

  it('should ignore ctrl+context menu events', () => {
    const handler = createContextMenuHandler([{ label: 'One', onClick: vi.fn() }]);

    render(() => (
      <>
        <div data-testid="target" onContextMenu={handler}>
          target
        </div>
        <ContextMenuUI />
      </>
    ));

    fireEvent.contextMenu(screen.getByTestId('target'), { ctrlKey: true });
    expect(screen.queryByRole('button', { name: 'One' })).toBeNull();
  });

  it('should ignore input elements as context menu targets', () => {
    const handler = createContextMenuHandler([{ label: 'Two', onClick: vi.fn() }]);

    render(() => (
      <>
        <input data-testid="input" onContextMenu={handler} />
        <ContextMenuUI />
      </>
    ));

    fireEvent.contextMenu(screen.getByTestId('input'));
    expect(screen.queryByRole('button', { name: 'Two' })).toBeNull();
  });
});
