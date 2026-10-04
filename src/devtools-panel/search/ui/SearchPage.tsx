import { Match, Show, Switch } from 'solid-js';

import { createGetSetting } from '../../store/store';
import { SearchContext } from '../model/context';
import { createSearch } from '../model/create-search';
import { gameData } from '../model/game-data';
import { createContainerWidth, createLayoutModes } from '../model/layout';
import { createSearchPersistence } from '../model/search-state';
import { DetailPane } from './detail/DetailPane';
import { ActiveChips } from './filters/ActiveChips';
import { FilterBar } from './filters/FilterBar';
import { FilterRail } from './filters/FilterRail';
import { FilterStrip } from './filters/FilterStrip';
import { QueryBar } from './QueryBar';
import { ResultsPane } from './results/ResultsPane';
import { ViewSwitch } from './ViewSwitch';

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
