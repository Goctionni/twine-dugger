import { createVirtualizer } from '@tanstack/solid-virtual';
import { For, Match, Show, Switch } from 'solid-js';

import { Code } from '@/devtools-panel/ui/code';
import { MovableSplit } from '@/devtools-panel/ui/util/MovableSplit';
import { ParsedPassageData } from '@/shared/shared-types';

import { createGetViewState, getGameMetaData, setViewState } from '../../store';
import { PassageHeader } from '../Passage/PassageHeader';
import { PassageListItem } from '../Passage/PassageListItem';

interface Props {
  results: ParsedPassageData[];
}

export function PassageResults(props: Props) {
  let scrollElRef: HTMLDivElement | undefined;
  const virtualizer = createVirtualizer({
    getScrollElement: () => scrollElRef ?? null,
    estimateSize: () => 35,
    get count() {
      return props.results.length;
    },
    overscan: 5,
  });

  const onPassageClick = (passage: ParsedPassageData) => {
    setViewState('passage', 'selected', { ...passage });
  };

  const format = () => getGameMetaData()!.format;
  const getSelectedPassage = createGetViewState('passage', 'selected');

  return (
    <MovableSplit
      splitKey="search-passage-results"
      class="flex h-full w-full grow overflow-hidden"
      initialLeftWidthPercent={50}
      leftContent={
        <div class="h-full overflow-auto" ref={scrollElRef}>
          <ul class="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            <For each={virtualizer.getVirtualItems()}>
              {(virtualItem) => {
                const result = () => props.results[virtualItem.index]!;
                return (
                  <Show when={result()}>
                    <PassageListItem
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      passageData={result()}
                      onClick={() => onPassageClick(result())}
                      active={getSelectedPassage()?.id === result().id}
                    />
                  </Show>
                );
              }}
            </For>
          </ul>
        </div>
      }
      rightContent={
        <div class="flex h-full w-full flex-col">
          <Switch>
            <Match when={getSelectedPassage()}>
              <div class="-mt-3 -mb-1 px-3">
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
