import { createMemo, For, Show } from 'solid-js';

import { goToPassage } from '@/devtools-panel/api/api';
import { savePassage } from '@/devtools-panel/store/passages';
import { getGameMetaData, setNavigationPage, setViewState } from '@/devtools-panel/store/store';
import { Code } from '@/devtools-panel/ui/code';
import { Tag } from '@/devtools-panel/ui/display/Tag';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import type { ParsedPassageData } from '@/shared/shared-types';

import type { QueryMatcher } from '../types';

/** More than this many marks in an editor is no use to anyone */
const MAX_MATCHES = 2000;

interface Props {
  passage: ParsedPassageData;
  queryMatcher: QueryMatcher | null;
  searchesContent: boolean;
}

export function PassageDetail(props: Props) {
  const matches = createMemo(() =>
    props.searchesContent
      ? (props.queryMatcher?.ranges(props.passage.content, MAX_MATCHES) ?? [])
      : undefined,
  );

  const openInPassages = () => {
    setViewState('passages', 'selected', props.passage.name);
    setNavigationPage('passages');
  };

  return (
    <div class="flex h-full flex-col gap-2 p-3">
      <h3 class="font-mono text-lg break-all">{props.passage.name}</h3>
      <Show when={props.passage.tags?.length}>
        <div class="flex flex-wrap gap-1">
          <For each={props.passage.tags}>{(tag) => <Tag tag={tag} />}</For>
        </div>
      </Show>
      <div class="flex gap-2">
        <button
          type="button"
          class={btnClass('contained')}
          title="Go to passage in-game"
          onClick={() => goToPassage(props.passage.name)}
        >
          Go to passage
        </button>
        <button type="button" class={btnClass('outline')} onClick={openInPassages}>
          Open in Passages
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-hidden">
        <Code
          code={props.passage.content ?? ''}
          format={getGameMetaData()?.format?.name}
          matches={matches()}
          onSave={(code) => savePassage(props.passage, code)}
        />
      </div>
    </div>
  );
}
