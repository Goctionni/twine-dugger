import { For, Match, Switch } from 'solid-js';

import { setPassage } from '@/devtools-panel/api/api';
import { Code } from '@/devtools-panel/ui/code';
import { MovableSplit } from '@/devtools-panel/ui/util/MovableSplit';
import type { ParsedPassageData } from '@/shared/shared-types';

import {
  getGameMetaData,
  getSelectedPassage,
  setPassageData,
  setViewState,
} from '../../store/store';
import { PassageHeader } from '../Passage/PassageHeader';
import { PassageListItem } from '../Passage/PassageListItem';

interface Props {
  results: ParsedPassageData[];
}

export function PassageResults(props: Props) {
  const onPassageClick = (passage: ParsedPassageData) => {
    setViewState('passage', 'selected', passage.name);
  };

  const format = () => getGameMetaData()!.format;

  const onSave = (code: string) => {
    const passage = getSelectedPassage();
    if (!passage) return;
    setPassage({ name: passage.name, source: code });

    const newPassage: ParsedPassageData = { ...passage, content: code };
    setPassageData((current) => {
      return current.map((oldpassage) => {
        if (oldpassage.id !== passage.id) return oldpassage;
        return newPassage;
      });
    });
  };

  return (
    <MovableSplit
      splitKey="search-passage-results"
      class="flex h-full w-full grow overflow-hidden"
      initialLeftWidthPercent={50}
      leftContent={
        <div class="h-full overflow-auto">
          <ul class="w-full">
            <For each={props.results}>
              {(result) => (
                <PassageListItem
                  passageData={result}
                  onClick={() => onPassageClick(result)}
                  active={getSelectedPassage()?.id === result.id}
                />
              )}
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
              <Code
                code={getSelectedPassage()!.content ?? ''}
                format={format()!.name}
                onSave={onSave}
              />
            </Match>
          </Switch>
        </div>
      }
    />
  );
}
