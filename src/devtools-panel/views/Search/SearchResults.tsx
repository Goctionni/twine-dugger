import { createMemo, Show } from 'solid-js';

import { createGetViewState, getLatestStateFrame, getPassageData } from '../../store';
import { PassageResults } from './PassageResults';
import { findPassageMatches, findStateMatches } from './search-utils';
import { StateResults } from './StateResults';

export function SearchResults() {
  const getQuery = createGetViewState('search', 'query');

  const searchResults = createMemo(() => {
    if (!getQuery()) return { state: [], passage: [] };
    const gameState = getLatestStateFrame();
    if (!gameState) return { state: [], passage: [] };
    return {
      state: findStateMatches(gameState.state, getQuery()),
      passage: findPassageMatches(getPassageData(), getQuery()),
    };
  });

  const hasResults = createMemo(() => Object.values(searchResults()).some((arr) => arr.length > 0));

  return (
    <Show when={hasResults()}>
      <div class="flex-1 overflow-hidden px-4">
        <div class="w-full h-full flex gap-2 overflow-hidden">
          <StateResults results={searchResults().state} />
          <PassageResults results={searchResults().passage} />
        </div>
      </div>
    </Show>
  );
}
