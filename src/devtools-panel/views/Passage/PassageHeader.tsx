import { For, Show } from 'solid-js';

import { goToPassage } from '@/devtools-panel/api/api';
import { Tag } from '@/devtools-panel/ui/display/Tag';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { ParsedPassageData } from '@/shared/shared-types';

interface PassageHeaderProps {
  passage: ParsedPassageData;
}

export function PassageHeader(props: PassageHeaderProps) {
  return (
    <div class="-mx-4 -mt-2 bg-gray-950 px-4 pt-1">
      <div class="flex gap-4 py-2">
        <h3 class="text-lg text-nowrap">Selected Passage: {props.passage!.name}</h3>
        <div class="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => goToPassage(props.passage!.name)}
            title="Go to passage in-game"
            class={btnClass(
              'contained',
              '[REMOVE]: px-4 py-1 text-sm',
              'flex items-center justify-center gap-2 px-2 py-0.5 text-xs text-white',
            )}
          >
            <span class="material-symbols-outlined mt-0.5 text-sm">open_in_browser</span>
            Go to passage
          </button>
        </div>
      </div>
      <Show when={props.passage?.tags?.length}>
        <div class="mt-1 mb-3 flex flex-wrap gap-1">
          <For each={props.passage!.tags}>{(tag) => <Tag tag={tag} />}</For>
        </div>
      </Show>
    </div>
  );
}
