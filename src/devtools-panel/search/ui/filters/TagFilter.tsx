import { createMemo, createSignal, For, Show } from 'solid-js';

import { getTagColor } from '@/devtools-panel/ui/display/Tag';

import { useSearch } from '../../model/context';
import { clearTags, getTagFilter, toggleTag } from '../../model/search-state';
import { CheckRow } from './CheckRow';

/** The tags are the game's own, and there can be thousands: only the first are listed */
const MAX_LISTED = 100;

export function TagFilter() {
  const { tagCounts } = useSearch();
  const [find, setFind] = createSignal('');

  // Chosen tags first, then the most common
  const matching = createMemo(() => {
    const needle = find().trim().toLowerCase();
    const counts = tagCounts();
    const chosen = getTagFilter();
    const all = new Set([...counts.keys(), ...chosen]);
    return [...all]
      .filter((tag) => !needle || tag.toLowerCase().includes(needle))
      .toSorted(
        (a, b) =>
          Number(chosen.includes(b)) - Number(chosen.includes(a)) ||
          (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
          a.localeCompare(b),
      );
  });
  const listed = () => matching().slice(0, MAX_LISTED);

  return (
    <div class="flex flex-col gap-1">
      <input
        type="search"
        class="w-full rounded-sm border border-slate-600 bg-slate-900 px-1.5 py-1 text-sm"
        placeholder="Find a tag…"
        value={find()}
        onInput={(event) => setFind(event.currentTarget.value)}
      />
      <Show when={getTagFilter().length}>
        <button
          type="button"
          class="cursor-pointer self-end px-1 text-xs text-sky-400 hover:underline"
          onClick={() => clearTags()}
        >
          Any tag
        </button>
      </Show>
      <For each={listed()} fallback={<p class="px-1 text-sm text-slate-400">No tags in results</p>}>
        {(tag) => (
          <CheckRow
            checked={getTagFilter().includes(tag)}
            onChange={() => toggleTag(tag)}
            count={tagCounts().get(tag) ?? 0}
          >
            <span
              class="truncate rounded-sm px-1.5 text-xs text-white"
              style={{ 'background-color': getTagColor(tag) }}
            >
              {tag}
            </span>
          </CheckRow>
        )}
      </For>
      <Show when={matching().length > MAX_LISTED}>
        <p class="px-1 text-xs text-slate-400">
          {matching().length - MAX_LISTED} more: find a tag to narrow the list
        </p>
      </Show>
    </div>
  );
}
