import { createStore, Show, type Accessor } from 'solid-js';

import type { ParsedPassageData } from '@/shared/shared-types';

import type { PassageHit, StateHit } from '../../core/types';
import { PassageRow } from './PassageRow';
import { ResultList } from './ResultList';
import { getView } from './results-view';
import { ResultSection } from './ResultSection';
import { StateRow } from './StateRow';
import { ViewSwitch } from './ViewSwitch';

const STATE_ROW_HEIGHT = 30;
const PASSAGE_ROW_HEIGHT = 54;

interface Props {
  /** Whether there is something to search for */
  hasQuery: boolean;
  /** What was found and is shown: the same object for a hit that stays, so this is what rows read */
  stateHits: readonly StateHit[];
  passageHits: readonly PassageHit[];
  /** The same hits, as a plain array that is new whenever they change: this tells the keys apart */
  sortedStateHits: Accessor<readonly StateHit[]>;
  sortedPassageHits: Accessor<readonly PassageHit[]>;
  /** Found, before the filters. The hits have what is left of it */
  stateTotal: number;
  passageTotal: number;
  /** What a passage row shows besides what the hit has */
  getPassage: (id: number) => ParsedPassageData | undefined;
  countMatches: (text: string) => number;
}

/** The switch for what is shown, and the results of the search: a section for the state and one for the passages */
export function ResultsPane(props: Props) {
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
      <ViewSwitch
        hasQuery={props.hasQuery}
        stateTotal={props.stateTotal}
        passageTotal={props.passageTotal}
      />
      <div class="min-h-0 flex-1">
        <Show
          when={props.hasQuery}
          fallback={
            <p class="p-4 text-sm text-slate-400">Type to search the state and the passages.</p>
          }
        >
          <div class="flex h-full min-h-0 flex-col">
            <Show when={showState()}>
              <ResultSection
                title="State"
                shown={props.stateHits.length}
                total={props.stateTotal}
                collapsible={both()}
                collapsed={both() && collapsed.state}
                onToggle={() => toggleCollapsed('state')}
                empty="No results"
              >
                <ResultList
                  items={props.stateHits}
                  order={props.sortedStateHits}
                  rowHeight={STATE_ROW_HEIGHT}
                >
                  {(hit) => <StateRow hit={hit} />}
                </ResultList>
              </ResultSection>
            </Show>
            <Show when={showPassages()}>
              <ResultSection
                title="Passages"
                shown={props.passageHits.length}
                total={props.passageTotal}
                collapsible={both()}
                collapsed={both() && collapsed.passage}
                onToggle={() => toggleCollapsed('passage')}
                empty="No results"
              >
                <ResultList
                  items={props.passageHits}
                  order={props.sortedPassageHits}
                  rowHeight={PASSAGE_ROW_HEIGHT}
                >
                  {(hit) => (
                    <PassageRow
                      hit={hit}
                      getPassage={props.getPassage}
                      countMatches={props.countMatches}
                    />
                  )}
                </ResultList>
              </ResultSection>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
