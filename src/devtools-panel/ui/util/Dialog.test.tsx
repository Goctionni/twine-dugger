/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { Dialog } from './Dialog';

describe('Dialog', () => {
  let showModalMock: ReturnType<typeof vi.fn>;
  let closeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    showModalMock = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    closeMock = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      writable: true,
      value: showModalMock,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      writable: true,
      value: closeMock,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should open modal when open is true', () => {
    render(() => (
      <Dialog open heading="Header">
        <div>Content</div>
      </Dialog>
    ));

    expect(showModalMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('should close modal when open is false', () => {
    render(() => (
      <Dialog open={false} heading="Header">
        <div>Content</div>
      </Dialog>
    ));

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('should call onClose handler when close event fires', () => {
    const onClose = vi.fn();
    render(() => (
      <Dialog open onClose={onClose}>
        <div>Dialog body</div>
      </Dialog>
    ));

    const dialog = document.querySelector('dialog');
    if (!(dialog instanceof HTMLDialogElement)) {
      throw new Error('Expected dialog element to exist');
    }

    fireEvent(dialog, new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
