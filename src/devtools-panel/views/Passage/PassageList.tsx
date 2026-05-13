import { For } from 'solid-js';

import { VirtualizedList } from '@/devtools-panel/ui/util/VirtualizedList';
import { ParsedPassageData } from '@/shared/shared-types';

import { PassageListItem } from './PassageListItem';

interface Props {
  passages: ParsedPassageData[];
  selectedPassage: ParsedPassageData | null;
  onPassageClick: (passage: ParsedPassageData) => void;
}

const VIRTUALIZE_THRESHOLD = 300;
const PASSAGE_ROW_HEIGHT = 38;

export function PassageList(props: Props) {
  return (
    <div class="px-4 py-2 h-full flex flex-col overflow-auto">
      <h1 class="font-bold text-xl mb-2">Passages</h1>
      {props.passages.length > VIRTUALIZE_THRESHOLD ? (
        <VirtualizedList
          class="flex-1 overflow-auto"
          items={props.passages}
          itemHeight={PASSAGE_ROW_HEIGHT}
          renderItem={(item) => (
            <PassageListItem
              passageData={item}
              onClick={() => props.onPassageClick(item)}
              active={props.selectedPassage?.id === item.id}
            />
          )}
        />
      ) : (
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
      )}
    </div>
  );
}
