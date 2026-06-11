import { createVirtualizer } from '@tanstack/solid-virtual';
import { createEffect, For, onCleanup, Show, untrack } from 'solid-js';

import { reloadPassagesData } from '@/devtools-panel/store';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { virtualizerScrollToFn } from '@/devtools-panel/utils/virtualizer-scrollto';
import type { ParsedPassageData } from '@/shared/shared-types';

import { PassageListItem } from './PassageListItem';

let beforeCleanup: BeforeCleanup | null = null;

interface Props {
  passages: ParsedPassageData[];
  selectedPassage: ParsedPassageData | null;
  onPassageClick: (passage: ParsedPassageData) => void;
}

export function PassageList(props: Props) {
  let scrollElRef: HTMLDivElement | undefined;
  const virtualizer = createVirtualizer({
    initialOffset: beforeCleanup?.offset ?? 0,
    getScrollElement: () => scrollElRef ?? null,
    estimateSize: () => 35,
    get count() {
      return props.passages.length;
    },
    overscan: 5,
    scrollToFn: virtualizerScrollToFn,
  });

  // Only run this once, after the initial render
  createEffect(() => {
    untrack(() => {
      if (!props.selectedPassage) return;

      const selectedPassageId = props.selectedPassage.id;
      if (selectedPassageId === beforeCleanup?.passageId) return;

      // If its a different passage, smooth scroll to that passage
      const index = props.passages.findIndex((passage) => passage.id === selectedPassageId);
      if (index >= 0) virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
    });
  });

  onCleanup(() => {
    beforeCleanup = {
      offset: virtualizer.scrollOffset,
      passageId: untrack(() => props.selectedPassage?.id),
    };
  });

  return (
    <div class="flex h-full flex-col overflow-auto px-4 py-2">
      <div class="mb-2 flex">
        <h1 class="flex-1 text-xl font-bold">Passages</h1>
        <button
          type="button"
          onClick={() => reloadPassagesData()}
          class={btnClass(
            'outline',
            '[REMOVE]: px-4 py-1',
            'text-md flex items-center justify-center gap-2 rounded-full px-2 py-0.5 text-white',
          )}
        >
          <span class="material-symbols-outlined mt-0.5 text-sm">refresh</span>
        </button>
      </div>
      <div class="flex-1 overflow-auto" ref={scrollElRef}>
        <ul class="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(virtualItem) => {
              const passage = () => props.passages[virtualItem.index]!;
              return (
                <Show when={passage()}>
                  <PassageListItem
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    passageData={passage()}
                    onClick={() => props.onPassageClick(passage())}
                    active={props.selectedPassage?.id === passage().id}
                  />
                </Show>
              );
            }}
          </For>
        </ul>
      </div>
    </div>
  );
}

interface BeforeCleanup {
  offset: number | null;
  passageId?: number | null;
}
