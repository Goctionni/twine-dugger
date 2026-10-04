import { Show } from 'solid-js';

import { useSearch } from '../../model/context';
import { getCollapsed, getView, toggleCollapsed } from '../../model/search-state';
import { PassageRow } from './PassageRow';
import { ResultList } from './ResultList';
import { ResultSection } from './ResultSection';
import { StateRow } from './StateRow';

const STATE_ROW_HEIGHT = 30;
const PASSAGE_ROW_HEIGHT = 54;

/** The results of the search, a section for the state and one for the passages */
export function ResultsPane() {
  const search = useSearch();
  const showState = () => getView() !== 'passage';
  const showPassages = () => getView() !== 'state';
  const both = () => getView() === 'both';

  return (
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
            shown={search.stateList.length}
            total={search.stateTotal()}
            collapsible={both()}
            collapsed={both() && getCollapsed().state}
            onToggle={() => toggleCollapsed('state')}
            empty="No results"
          >
            <ResultList
              items={search.stateList}
              order={search.stateOrder}
              rowHeight={STATE_ROW_HEIGHT}
            >
              {(hit) => <StateRow hit={hit} />}
            </ResultList>
          </ResultSection>
        </Show>
        <Show when={showPassages()}>
          <ResultSection
            title="Passages"
            shown={search.passageList.length}
            total={search.passageTotal()}
            collapsible={both()}
            collapsed={both() && getCollapsed().passage}
            onToggle={() => toggleCollapsed('passage')}
            empty="No results"
          >
            <ResultList
              items={search.passageList}
              order={search.passageOrder}
              rowHeight={PASSAGE_ROW_HEIGHT}
            >
              {(hit) => <PassageRow hit={hit} />}
            </ResultList>
          </ResultSection>
        </Show>
      </div>
    </Show>
  );
}
