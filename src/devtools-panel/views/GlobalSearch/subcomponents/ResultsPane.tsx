import { Show } from 'solid-js';

import type { ParsedPassageData } from '@/shared/shared-types';

import type { PassageMatcherHit, QueryMatcher, Selected, StateMatcherHit } from '../types';
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
  /** What was found and is shown, in the order it is shown in */
  sortedStateHits: readonly StateMatcherHit[];
  sortedPassageHits: readonly PassageMatcherHit[];
  /** Found, before the filters. The hits have what is left of it */
  stateTotal: number;
  passageTotal: number;
  /** What a passage row shows besides what the hit has */
  getPassage: (id: number) => ParsedPassageData | undefined;
  queryMatcher: QueryMatcher | null;
  selected: Selected | null;
  /** Selects the result, or closes it when it is the selected one */
  onToggleSelected: (selected: Selected) => void;
}

/** The switch for what is shown, and the results of the search: a section for the state and one for the passages */
export function ResultsPane(props: Props) {
  const showState = () => getView() !== 'passage';
  const showPassages = () => getView() !== 'state';
  const both = () => getView() === 'both';

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
                shown={props.sortedStateHits.length}
                total={props.stateTotal}
                collapsible={both()}
              >
                <ResultList order={props.sortedStateHits} rowHeight={STATE_ROW_HEIGHT}>
                  {(hit) => (
                    <StateRow
                      hit={hit()}
                      isSelected={
                        props.selected?.section === 'state' && props.selected.hit.key === hit().key
                      }
                      onClick={() => props.onToggleSelected({ section: 'state', hit: hit() })}
                    />
                  )}
                </ResultList>
              </ResultSection>
            </Show>
            <Show when={showPassages()}>
              <ResultSection
                title="Passages"
                shown={props.sortedPassageHits.length}
                total={props.passageTotal}
                collapsible={both()}
              >
                <ResultList order={props.sortedPassageHits} rowHeight={PASSAGE_ROW_HEIGHT}>
                  {(hit) => (
                    <PassageRow
                      hit={hit()}
                      isSelected={
                        props.selected?.section === 'passage' && props.selected.key === hit().key
                      }
                      onClick={() => props.onToggleSelected({ section: 'passage', key: hit().key })}
                      getPassage={props.getPassage}
                      queryMatcher={props.queryMatcher}
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
