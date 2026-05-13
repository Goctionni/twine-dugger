import { For, Match, Switch } from 'solid-js';

import { Code } from '@/devtools-panel/ui/code';
import { MovableSplit } from '@/devtools-panel/ui/util/MovableSplit';
import { VirtualizedList } from '@/devtools-panel/ui/util/VirtualizedList';
import { ParsedPassageData } from '@/shared/shared-types';

import { createGetViewState, getGameMetaData, setNavigationPage, setViewState } from '../../store';
import { PassageHeader } from '../Passage/PassageHeader';
import { PassageListItem } from '../Passage/PassageListItem';
import { PassageView } from '../Passage/PassageView';

interface Props {
  results: ParsedPassageData[];
}

const VIRTUALIZE_THRESHOLD = 300;
const PASSAGE_ROW_HEIGHT = 38;

export function PassageResults(props: Props) {
  const onPassageClick = (passage: ParsedPassageData) => {
    setViewState('passage', 'selected', passage);
  };

  const format = () => getGameMetaData()!.format;
  const getSelectedPassage = createGetViewState('passage', 'selected');

  return (
    <MovableSplit
      class="flex flex-grow w-full overflow-hidden h-full"
      initialLeftWidthPercent={50}
      leftContent={
        props.results.length > VIRTUALIZE_THRESHOLD ? (
          <VirtualizedList
            class="h-full overflow-auto"
            items={props.results}
            itemHeight={PASSAGE_ROW_HEIGHT}
            renderItem={(result) => (
              <PassageListItem passageData={result} onClick={() => onPassageClick(result)} />
            )}
          />
        ) : (
          <ul class="h-full overflow-auto">
            <For each={props.results}>
              {(result) => (
                <PassageListItem passageData={result} onClick={() => onPassageClick(result)} />
              )}
            </For>
          </ul>
        )
      }
      rightContent={
        <div class="w-full h-full flex flex-col">
          <Switch>
            <Match when={getSelectedPassage()}>
              <div class="px-3 -mt-3 -mb-1">
                <PassageHeader passage={getSelectedPassage()!} />
              </div>
              <Code code={getSelectedPassage()!.content ?? ''} format={format()!.name} />
            </Match>
          </Switch>
        </div>
      }
    />
  );
}
