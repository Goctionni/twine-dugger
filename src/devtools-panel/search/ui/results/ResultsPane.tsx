import { createStore, Show } from 'solid-js';

import { useSearch } from '../../model/context';
import { PassageRow } from './PassageRow';
import { ResultList } from './ResultList';
import { getView } from './results-view';
import { ResultSection } from './ResultSection';
import { StateRow } from './StateRow';
import { ViewSwitch } from './ViewSwitch';

const STATE_ROW_HEIGHT = 30;
const PASSAGE_ROW_HEIGHT = 54;

/** The switch for what is shown, and the results of the search: a section for the state and one for the passages */
export function ResultsPane() {
  const search = useSearch();
  const showState = () => getView() !== 'passage';
  const showPassages = () => getView() !== 'state';
  const both = () => getView() === 'both';

  // Which sections are folded away: forgotten when the page is left
  const [collapsed, setCollapsed] = createStore({ state: false, passage: false });
  const toggleCollapsed = (section: 'state' | 'passage') =>
    setCollapsed((draft) => {
      draft[section] = !draft[section];
    });

  return (
    <div class="flex h-full min-h-0 flex-col">
      <ViewSwitch />
      <div class="min-h-0 flex-1">
        <Show
          when={search.hasQuery()}
          fallback={
            <p class="p-4 text-sm text-slate-400">Type to search the state and the passages.</p>
          }
        >
          <div class="flex h-full min-h-0 flex-col">
            <Show when={showState()}>
              <ResultSection
                title="State"
                shown={search.stateHits.length}
                total={search.stateTotal()}
                collapsible={both()}
                collapsed={both() && collapsed.state}
                onToggle={() => toggleCollapsed('state')}
                empty="No results"
              >
                <ResultList
                  items={search.stateHits}
                  order={search.sortedStateHits}
                  rowHeight={STATE_ROW_HEIGHT}
                >
                  {(hit) => <StateRow hit={hit} />}
                </ResultList>
              </ResultSection>
            </Show>
            <Show when={showPassages()}>
              <ResultSection
                title="Passages"
                shown={search.passageHits.length}
                total={search.passageTotal()}
                collapsible={both()}
                collapsed={both() && collapsed.passage}
                onToggle={() => toggleCollapsed('passage')}
                empty="No results"
              >
                <ResultList
                  items={search.passageHits}
                  order={search.sortedPassageHits}
                  rowHeight={PASSAGE_ROW_HEIGHT}
                >
                  {(hit) => <PassageRow hit={hit} />}
                </ResultList>
              </ResultSection>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
