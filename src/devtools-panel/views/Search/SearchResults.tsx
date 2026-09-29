import { createMemo, For, Match, Show, Switch } from 'solid-js';

import { btnClass } from '@/devtools-panel/ui/util/btnClass';

import { createGetViewState, setViewState } from '../../store/store';
import { createSearchResults } from './create-searchResults';
import { PassageResults } from './PassageResults';
import { StateResults } from './StateResults';

interface Tab {
  text: string;
  id: 'state' | 'passage';
  active: boolean;
  num: number;
}

export function SearchResults() {
  const getResultTab = createGetViewState('search', 'resultTab');
  const setResultTab = (tab: 'state' | 'passage') => setViewState('search', 'resultTab', tab);
  const getSearchResults = createSearchResults();

  // Only tabs with results are shown. The tab that was picked is used if it has results, and
  // otherwise the first one that does: with a single tab there is nothing else to look at.
  const resultTabs = createMemo(() => {
    const { state, passage } = getSearchResults();
    const available: Omit<Tab, 'active'>[] = [];
    if (state.length) available.push({ text: 'State', id: 'state', num: state.length });
    if (passage.length) available.push({ text: 'Passage', id: 'passage', num: passage.length });

    const activeId = (available.find((tab) => tab.id === getResultTab()) ?? available[0])?.id;
    return available.map((tab): Tab => ({ ...tab, active: tab.id === activeId }));
  });

  const activeTab = () => resultTabs().find((tab) => tab.active)?.id;

  return (
    <Show when={resultTabs().length}>
      <div class="flex flex-1 flex-col overflow-hidden">
        <div class="px-4">
          <div class="mb-2 flex gap-2">
            <h2 class="text-xl font-bold">Search results</h2>
            <For each={resultTabs()}>
              {(tab) => (
                <button
                  class={btnClass(
                    tab.active ? 'contained' : 'outline',
                    { 'clr-gray': !tab.active },
                    { 'pointer-events-none': tab.active },
                    'hover:clr-sky',
                  )}
                  type="button"
                  onClick={() => setResultTab(tab.id)}
                >
                  {tab.text} <span class="text-white">({tab.num})</span>
                </button>
              )}
            </For>
          </div>
        </div>
        <div class="flex-1 overflow-hidden px-3">
          <Switch>
            <Match when={activeTab() === 'state'}>
              <StateResults results={getSearchResults().state} />
            </Match>
            <Match when={activeTab() === 'passage'}>
              <PassageResults results={getSearchResults().passage} />
            </Match>
          </Switch>
        </div>
      </div>
    </Show>
  );
}
