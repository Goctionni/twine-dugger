import { For } from 'solid-js';

import { ParsedPassageData } from '@/shared/shared-types';

import { PassageListItem } from './PassageListItem';

interface Props {
  passages: ParsedPassageData[];
  selectedPassage: ParsedPassageData | null;
  onPassageClick: (passage: ParsedPassageData) => void;
}

export function PassageList(props: Props) {
  return (
    <div class="px-4 py-2 h-full flex flex-col overflow-auto">
      <h1 class="font-bold text-xl mb-2">Passages</h1>
      <ul class="flex-1 flex flex-col overflow-auto">
        <For each={props.passages}>
          {(item) => (
            <PassageListItem
              passageData={item}
              onClick={() => props.onPassageClick(item)}
              active={props.selectedPassage?.id === item.id}
            />
          )}
        </For>
      </ul>
    </div>
  );
}
