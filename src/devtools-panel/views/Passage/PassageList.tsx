import { createVirtualizer } from '@tanstack/solid-virtual';
import { For } from 'solid-js';

import { ParsedPassageData } from '@/shared/shared-types';

import { PassageListItem } from './PassageListItem';

interface Props {
  passages: ParsedPassageData[];
  selectedPassage: ParsedPassageData | null;
  onPassageClick: (passage: ParsedPassageData) => void;
}

export function PassageList(props: Props) {
  let scrollElRef: HTMLDivElement | undefined;
  const virtualizer = createVirtualizer({
    getScrollElement: () => (scrollElRef ?? null),
    estimateSize: () => 35,
    get count() { return props.passages.length },
    overscan: 5,
  });
  return (
    <div class="px-4 py-2 h-full flex flex-col overflow-auto">
      <h1 class="font-bold text-xl mb-2">Passages</h1>
      <div class="flex-1 overflow-auto" ref={scrollElRef}>
        <ul class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(virtualItem) => {
              const passage = () => props.passages[virtualItem.index]!;
              return (
                <PassageListItem
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                  passageData={passage()}
                  onClick={() => props.onPassageClick(passage())}
                  active={props.selectedPassage?.id === passage().id}
                />
              )
            }}
          </For>
        </ul>
      </div>
    </div>
  );
}
