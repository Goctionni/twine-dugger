import clsx from 'clsx';
import { createMemo, For, Show, type Accessor } from 'solid-js';

import { getTagColor } from '@/devtools-panel/ui/display/Tag';

import { snippetAround } from '../../core/snippet';
import type { PassageHit, Range } from '../../core/types';
import { useSearch } from '../../model/context';
import { Highlight } from './Highlight';

const MAX_TAGS = 3;
const NO_RANGES: Range[] = [];
const PREVIEW_LENGTH = 120;

interface Props {
  hit: Accessor<PassageHit>;
}

const sameNumbers = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export function PassageRow(props: Props) {
  const { selection, getPassage, query } = useSearch();
  const passage = createMemo(() => getPassage(props.hit().key));
  const name = () => passage()?.name ?? '';
  const tags = () => passage()?.tags ?? [];

  // The tags that are shown, as positions in the passage's tags: the ones that matched first
  const shownTags = createMemo(
    () => {
      const matched = props.hit().tags;
      const positions = tags().map((_, position) => position);
      const first = positions.filter((position) => matched[position]?.length);
      const rest = positions.filter((position) => !matched[position]?.length);
      return [...first, ...rest].slice(0, MAX_TAGS);
    },
    { equals: sameNumbers },
  );

  // Around the first match, or the start of the passage when it only matched in the name or tags
  const snippet = createMemo(
    () => {
      const content = passage()?.content ?? '';
      const match = props.hit().content;
      if (match) return snippetAround(content, match);
      return { text: content.slice(0, PREVIEW_LENGTH).replace(/\s/g, ' '), ranges: NO_RANGES };
    },
    { equals: (a, b) => a.text === b.text && a.ranges[0]?.[0] === b.ranges[0]?.[0] },
  );

  // How often it matches in the content: counted here, for the rows that are shown, not for every hit
  const contentMatches = createMemo(() =>
    props.hit().content ? (query()?.count(passage()?.content ?? '') ?? 0) : 0,
  );

  // Clicking the selected result again closes it
  const toggleSelected = (key: number) =>
    selection.select(selection.isSelected('passage', key) ? null : { section: 'passage', key });

  return (
    <button
      type="button"
      class={clsx(
        'flex h-full w-full cursor-pointer flex-col justify-center gap-0.5 border-t border-slate-700 px-3 text-left hover:bg-slate-700',
        selection.isSelected('passage', props.hit().key) &&
          'bg-sky-900 shadow-[inset_2px_0_#38bdf8]',
      )}
      onClick={() => toggleSelected(props.hit().key)}
    >
      <span class="flex min-w-0 items-center gap-2">
        <span class="min-w-0 flex-1 truncate font-mono text-sm" title={name()}>
          <Highlight text={name()} ranges={props.hit().name} />
        </span>
        <For each={shownTags()} keyed={false}>
          {(position) => (
            <span
              class="shrink-0 rounded-sm px-1.5 text-xs text-white"
              style={{ 'background-color': getTagColor(tags()[position()] ?? '') }}
            >
              <Highlight
                text={tags()[position()] ?? ''}
                ranges={props.hit().tags[position()] ?? NO_RANGES}
              />
            </span>
          )}
        </For>
        <Show when={tags().length > MAX_TAGS}>
          <span class="shrink-0 text-xs text-slate-400">+{tags().length - MAX_TAGS}</span>
        </Show>
      </span>
      <span class="flex min-w-0 items-center gap-2 text-xs text-slate-400">
        <span class="min-w-0 flex-1 truncate">
          <Highlight text={snippet().text} ranges={snippet().ranges} />
        </span>
        <Show when={contentMatches() > 1}>
          <span class="shrink-0">{contentMatches()}×</span>
        </Show>
      </span>
    </button>
  );
}
