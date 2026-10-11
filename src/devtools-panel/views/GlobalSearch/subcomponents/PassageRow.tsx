import clsx from 'clsx';
import { createMemo, For, Show } from 'solid-js';

import { getTagColor } from '@/devtools-panel/ui/display/Tag';
import { sameItems } from '@/devtools-panel/utils/same-items';
import type { ParsedPassageData } from '@/shared/shared-types';

import type { PassageMatcherHit, QueryMatcher, Range } from '../types';
import { Highlight } from './Highlight';

const MAX_TAGS = 3;
const NO_RANGES: Range[] = [];
const PREVIEW_LENGTH = 120;
const CHARS_BEFORE_MATCH = 38;
const CHARS_AFTER_MATCH = 80;

interface Snippet {
  text: string;
  ranges: Range[];
}

interface Props {
  hit: PassageMatcherHit;
  isSelected: boolean;
  onClick: () => void;
  getPassage: (id: number) => ParsedPassageData | undefined;
  queryMatcher: QueryMatcher | null;
}

export function PassageRow(props: Props) {
  const passage = createMemo(() => props.getPassage(props.hit.key));
  const name = () => passage()?.name ?? '';
  const tags = () => passage()?.tags ?? [];

  // The tags that are shown, as positions in the passage's tags: the ones that matched first
  const shownTags = createMemo(
    () => {
      const matched = props.hit.tagRanges;
      const positions = tags().map((_, position) => position);
      const first = positions.filter((position) => matched[position]?.length);
      const rest = positions.filter((position) => !matched[position]?.length);
      return [...first, ...rest].slice(0, MAX_TAGS);
    },
    { equals: sameItems },
  );

  // Around the first match, or the start of the passage when it only matched in the name or tags
  const snippet = createMemo(
    () => {
      const content = passage()?.content ?? '';
      const match = props.hit.firstContentRange;
      if (match) return snippetAround(content, match);
      return { text: content.slice(0, PREVIEW_LENGTH).replace(/\s/g, ' '), ranges: NO_RANGES };
    },
    { equals: (a, b) => a.text === b.text && a.ranges[0]?.[0] === b.ranges[0]?.[0] },
  );

  // How often it matches in the content: counted here, for the rows that are shown, not for every hit
  const contentMatches = createMemo(() =>
    props.hit.firstContentRange ? (props.queryMatcher?.count(passage()?.content ?? '') ?? 0) : 0,
  );

  return (
    <button
      type="button"
      class={clsx(
        'flex h-full w-full cursor-pointer flex-col justify-center gap-0.5 border-t border-slate-700 px-3 text-left hover:bg-slate-700',
        props.isSelected && 'bg-sky-900 shadow-[inset_2px_0_#38bdf8]',
      )}
      onClick={() => props.onClick()}
    >
      <span class="flex min-w-0 items-center gap-2">
        <span class="min-w-0 flex-1 truncate font-mono text-sm" title={name()}>
          <Highlight text={name()} ranges={props.hit.nameRanges} />
        </span>
        <For each={shownTags()} keyed={false}>
          {(position) => (
            <span
              class="tag-chip shrink-0 rounded-sm px-1.5 text-xs text-white"
              style={{ 'background-color': getTagColor(tags()[position()] ?? '') }}
            >
              <Highlight
                text={tags()[position()] ?? ''}
                ranges={props.hit.tagRanges[position()] ?? NO_RANGES}
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

export function snippetAround(content: string, [start, end]: Range): Snippet {
  const from = Math.max(0, start - CHARS_BEFORE_MATCH);
  const to = Math.min(content.length, end + CHARS_AFTER_MATCH);
  const lead = from > 0 ? '…' : '';
  const text =
    lead + content.slice(from, to).replace(/\s/g, ' ') + (to < content.length ? '…' : '');
  const offset = lead.length - from;
  return { text, ranges: [[start + offset, end + offset]] };
}
