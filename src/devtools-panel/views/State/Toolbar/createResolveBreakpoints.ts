import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';

import { createElementWidth } from '@/devtools-panel/utils/create-element-width';
import { mapObject } from '@/devtools-panel/utils/map-object';

type Config = Record<string, Record<string, number>>;

interface Breakpoint<T extends Record<string, number>> {
  breakpointName: keyof T & string;
  value: number;
}

const sortBreakpoints = <T extends Record<string, number>>(group: T): Breakpoint<T>[] =>
  Object.values(mapObject(group, (value, breakpointName) => ({ breakpointName, value }))).toSorted(
    (a, b) => a.value - b.value,
  );

/**
 * For each group of named minimum widths, the name of the widest one that fits the width of the
 * container, as it changes. Until the container is measured that is the narrowest.
 */
export function createResolveBreakpoints<C extends Config>(
  config: C,
  getContainer: () => HTMLElement | undefined,
) {
  const getWidth = createElementWidth(getContainer);

  const sorted = mapObject(config, sortBreakpoints);

  const resolved = mapObject(sorted, (breakpoints) =>
    createMemo(() => {
      const width = getWidth();
      const breakpoint = breakpoints.findLast(({ value }) => value <= width) ?? breakpoints[0]!;
      return breakpoint.breakpointName;
    }),
  );

  // Unfortunately typescript cannot derive per-key specific return types, so our mapObject result needs to be typecast
  return resolved as { [K in keyof C]: Accessor<keyof C[K] & string> };
}
