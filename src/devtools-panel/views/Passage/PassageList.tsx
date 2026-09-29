import { For, onCleanup, onSettled, untrack } from 'solid-js';

import { reloadPassagesData } from '@/devtools-panel/store/store';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
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

  // Restore where the list was scrolled to, and scroll to the selected passage if it changed
  onSettled(() => {
    if (!scrollElRef) return;
    scrollElRef.scrollTop = beforeCleanup?.offset ?? 0;

    const selectedPassageId = props.selectedPassage?.id;
    if (selectedPassageId === undefined || selectedPassageId === beforeCleanup?.passageId) return;

    // If its a different passage, smooth scroll to that passage
    scrollElRef
      .querySelector(`[data-id="${selectedPassageId}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  onCleanup(() => {
    beforeCleanup = {
      offset: beforeCleanup?.offset ?? 0,
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
      <div
        class="flex-1 overflow-auto"
        ref={scrollElRef}
        onScroll={(e) => {
          beforeCleanup = { ...beforeCleanup, offset: e.currentTarget.scrollTop };
        }}
      >
        <ul class="w-full">
          <For each={props.passages}>
            {(passage) => (
              <PassageListItem
                passageData={passage}
                onClick={() => props.onPassageClick(passage)}
                active={props.selectedPassage?.id === passage.id}
              />
            )}
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
