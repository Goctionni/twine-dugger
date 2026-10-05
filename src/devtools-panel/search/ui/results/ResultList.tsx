import type { JSX } from '@solidjs/web';
import { createMemo, For, Show, type Accessor } from 'solid-js';

import { createVirtualizer } from '@/devtools-panel/utils/create-virtualizer';

interface Props<T extends { key: string | number }> {
  /** What was found, with the same object for a hit that stays; this is what the rows read */
  items: readonly T[];
  /** The same hits, as a plain array that is new whenever they change; this tells the keys apart */
  order: Accessor<readonly T[]>;
  rowHeight: number;
  children: (hit: Accessor<T>) => JSX.Element;
}

/**
 * Only the rows that are in view exist. A row belongs to a hit, not to a position: when a hit moves
 * or the results are replaced, the rows of the hits that are still there stay as they are.
 */
export function ResultList<T extends { key: string | number }>(props: Props<T>) {
  let scrollElement: HTMLDivElement | undefined;

  const virtualizer = createVirtualizer({
    getScrollElement: () => scrollElement ?? null,
    get count() {
      return props.order().length;
    },
    // Looked at again when the results change: that is when the order does
    get getItemKey() {
      const staticOrder = props.order();
      return (index: number) => staticOrder[index]!.key;
    },
    get estimateSize() {
      const staticHeight = props.rowHeight;
      return () => staticHeight;
    },
    reconcileBy: 'key',
    overscan: 6,
  });

  return (
    <div class="h-full overflow-auto" ref={scrollElement}>
      <ul class="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualItem) => {
            const hit = createMemo(() => props.items[virtualItem.index]);
            return (
              <Show when={hit()}>
                {(current) => (
                  <li
                    class="absolute top-0 left-0 w-full"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {props.children(current)}
                  </li>
                )}
              </Show>
            );
          }}
        </For>
      </ul>
    </div>
  );
}
