import { Match, Show, Switch } from 'solid-js';

import { SearchContext } from '../search/model/context';
import { createSearch } from '../search/model/create-search';
import { gameData } from '../search/model/game-data';
import { createContainerWidth, createLayoutModes } from '../search/model/layout';
import { createSearchPersistence } from '../search/model/search-state';
import { DetailPane } from '../search/ui/detail/DetailPane';
import { ActiveChips } from '../search/ui/filters/ActiveChips';
import { FilterBar } from '../search/ui/filters/FilterBar';
import { FilterRail } from '../search/ui/filters/FilterRail';
import { FilterStrip } from '../search/ui/filters/FilterStrip';
import { QueryBar } from '../search/ui/QueryBar';
import { ResultsPane } from '../search/ui/results/ResultsPane';
import { ViewSwitch } from '../search/ui/ViewSwitch';
import { createGetSetting } from '../store/store';

const getNarrowStyle = createGetSetting('search.narrowStyle');

/**
 * The shape of the page follows from how wide it is, because DevTools can be docked anywhere:
 * the filters are a rail, a strip or a bar, and the selected result is a column or a sheet.
 * Only the layout that is in use is on the page.
 */
export function SearchPage() {
  const model = createSearch(gameData);
  createSearchPersistence();

  let root: HTMLDivElement | undefined;
  const width = createContainerWidth(() => root);
  const { filterMode, detailMode } = createLayoutModes(width, getNarrowStyle);

  return (
    <SearchContext value={model}>
      <div class="relative flex h-full w-full flex-col overflow-hidden" ref={root}>
        {/* With a rail the filters run the full height, and the query is above the results only */}
        <Show when={filterMode() !== 'rail'}>
          <QueryBar showLayoutToggle={filterMode() === 'bar'} />
        </Show>
        <div class="flex min-h-0 flex-1">
          <Switch>
            <Match when={filterMode() === 'rail'}>
              <FilterRail />
            </Match>
            <Match when={filterMode() === 'strip'}>
              <FilterStrip />
            </Match>
          </Switch>
          <main class="flex min-w-0 flex-1 flex-col">
            <Show when={filterMode() === 'rail'}>
              <QueryBar showLayoutToggle={false} />
            </Show>
            <Show when={filterMode() === 'bar'}>
              <FilterBar />
            </Show>
            <ActiveChips />
            <ViewSwitch />
            <div class="min-h-0 flex-1">
              <ResultsPane />
            </div>
          </main>
          <Show when={detailMode() === 'column'}>
            <DetailPane mode="column" />
          </Show>
        </div>
        <Show when={detailMode() === 'sheet'}>
          <DetailPane mode="sheet" />
        </Show>
      </div>
    </SearchContext>
  );
}
