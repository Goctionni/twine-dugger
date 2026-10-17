import { createRoot, flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createResolveBreakpoints } from './createResolveBreakpoints';

describe('createResolveBreakpoints', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves the widest breakpoint that fits, as the width changes', () => {
    let callback: ResizeObserverCallback = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const container = { getBoundingClientRect: () => ({ width: 300 }) } as unknown as HTMLElement;

    let dispose = () => {};
    const breakpoints = createRoot((d) => {
      dispose = d;
      return createResolveBreakpoints(
        {
          typeFilter: { minimal: 0, labels: 520, full: 640 },
          // Not in order
          sort: { labels: 520, minimal: 0 },
        } as const,
        () => container,
      );
    });
    flush();

    const seen = [{ typeFilter: breakpoints.typeFilter(), sort: breakpoints.sort() }];
    for (const width of [546, 746, 400]) {
      callback([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
      flush();
      seen.push({ typeFilter: breakpoints.typeFilter(), sort: breakpoints.sort() });
    }
    dispose();

    expect(seen).toEqual([
      { typeFilter: 'minimal', sort: 'minimal' },
      { typeFilter: 'labels', sort: 'labels' },
      { typeFilter: 'full', sort: 'labels' },
      { typeFilter: 'minimal', sort: 'minimal' },
    ]);
  });
});
