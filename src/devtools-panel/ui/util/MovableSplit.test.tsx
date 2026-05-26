/** @vitest-environment jsdom */

import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { getPersistedValueMock, setPersistedValueMock } = vi.hoisted(() => ({
  getPersistedValueMock: vi.fn(),
  setPersistedValueMock: vi.fn(),
}));

vi.mock('./persistedValue', () => ({
  getPersistedValue: getPersistedValueMock,
  setPersistedValue: setPersistedValueMock,
}));

import { MovableSplit } from './MovableSplit';

describe('MovableSplit', () => {
  beforeEach(() => {
    getPersistedValueMock.mockReset();
    setPersistedValueMock.mockReset();
    getPersistedValueMock.mockReturnValue('35%');
  });

  afterEach(() => cleanup());

  it('should load persisted width when split key is provided', () => {
    const { container } = render(() => (
      <MovableSplit
        splitKey="main-split"
        leftContent={<div>left</div>}
        rightContent={<div>right</div>}
      />
    ));

    const leftPanel = container.querySelector('.bg-gray-900[style]');
    expect(getPersistedValueMock).toHaveBeenCalledWith('main-split', '50%');
    expect(leftPanel?.getAttribute('style')).toContain('width: 35%');
  });

  it('should resize and persist width while dragging divider', () => {
    const { container } = render(() => (
      <MovableSplit
        splitKey="main-split"
        leftContent={<div>left</div>}
        rightContent={<div>right</div>}
      />
    ));

    const root = container.firstElementChild as HTMLDivElement;
    const divider = container.querySelector('.cursor-col-resize');
    if (!(root instanceof HTMLDivElement) || !(divider instanceof HTMLDivElement)) {
      throw new Error('Expected split root and divider to exist');
    }

    root.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 0,
        right: 1010,
        bottom: 300,
        width: 1000,
        height: 300,
        x: 10,
        y: 0,
      }) as DOMRect;

    fireEvent.mouseDown(divider, { clientX: 200 });
    fireEvent.mouseMove(document, { clientX: 420 });
    fireEvent.mouseUp(document);

    expect(setPersistedValueMock).toHaveBeenCalledWith('main-split', '406px');
  });

  it('should avoid persistence writes when split key is missing', () => {
    const { container } = render(() => (
      <MovableSplit leftContent={<div>left</div>} rightContent={<div>right</div>} />
    ));

    const root = container.firstElementChild as HTMLDivElement;
    const divider = container.querySelector('.cursor-col-resize');
    if (!(root instanceof HTMLDivElement) || !(divider instanceof HTMLDivElement)) {
      throw new Error('Expected split root and divider to exist');
    }

    root.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 300,
        width: 1000,
        height: 300,
        x: 0,
        y: 0,
      }) as DOMRect;

    fireEvent.mouseDown(divider, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    expect(setPersistedValueMock).not.toHaveBeenCalled();
  });
});
