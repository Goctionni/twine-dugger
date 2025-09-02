import { For } from 'solid-js';

import { ParsedPassageData } from '@/shared/shared-types';

import { setNavigationPage, setViewState } from '../../store';
import { PassageListItem } from '../Passage/PassageListItem';

interface Props {
  results: ParsedPassageData[];
}

export function PassageResults(props: Props) {
  const onPassageClick = (passage: ParsedPassageData) => {
    setNavigationPage('passages');
    setViewState('passage', 'selected', passage);
  };

  return (
    <div class="h-full flex-1 overflow-hidden flex flex-col">
      <h1 class="font-bold text-base pt-4 pb-2">Passage Results</h1>
      <ul class="h-full overflow-auto flex-1">
        <For each={props.results}>
          {(result) => (
            <PassageListItem passageData={result} onClick={() => onPassageClick(result)} />
          )}
        </For>
      </ul>
    </div>
  );
}
