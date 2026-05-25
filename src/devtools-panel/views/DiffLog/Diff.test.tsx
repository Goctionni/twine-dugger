/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../../store', () => ({
  addFilteredPath: vi.fn(),
  setViewState: vi.fn(),
  getActiveState: vi.fn(() => ({ x: 1, hp: 1, obj: { k: 1 }, arr: ['x'], s: new Set(['x']) })),
}));

import { DiffItem } from './Diff';

afterEach(() => cleanup());

describe('DiffItem', () => {
  it('should render type-changed diff', () => {
    render(() =>
      DiffItem({ diff: { type: 'type-changed', path: ['x'], oldValue: 1, newValue: '1' } as any }),
    );

    expect(screen.getByText('x')).toBeTruthy();
  });

  it('should render primitive change', () => {
    render(() =>
      DiffItem({ diff: { type: 'number', path: ['hp'], oldValue: 1, newValue: 2 } as any }),
    );

    expect(screen.getByText('hp')).toBeTruthy();
  });

  it('should render object add/remove and list add/remove', () => {
    render(() =>
      DiffItem({
        diff: { type: 'object', subtype: 'add', path: ['obj'], key: 'k', newValue: 1 } as any,
      }),
    );
    expect(screen.getByText('obj')).toBeTruthy();
    expect(screen.getByText('k')).toBeTruthy();

    cleanup();
    render(() =>
      DiffItem({
        diff: { type: 'array', subtype: 'add', path: ['arr'], index: 0, newValue: 'x' } as any,
      }),
    );
    expect(screen.getByText('arr')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();

    cleanup();
    render(() =>
      DiffItem({ diff: { type: 'set', subtype: 'remove', path: ['s'], oldValue: 'x' } as any }),
    );
    expect(screen.getByText('s')).toBeTruthy();
  });

  it('should hide array instructions diff when no move instructions exist', () => {
    render(() =>
      DiffItem({
        diff: {
          type: 'array',
          subtype: 'instructions',
          path: ['arr'],
          instructions: [{ type: 'add', index: 0, value: 'x' }],
        } as any,
      }),
    );

    expect(screen.queryByText('arr')).toBeNull();
  });
});
