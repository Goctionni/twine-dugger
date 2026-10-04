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

  // Chosen tags first, then the most common. Not a sort of everything with a rich comparison: there
  // can be thousands of tags, and this runs for every change of the results
  const matching = createMemo(() => {
    const staticNeedle = find().trim().toLowerCase();
    const counts = tagCounts();
    const chosen = getTagFilter();
    const fits = (tag: string) => !staticNeedle || tag.toLowerCase().includes(staticNeedle);
    const others: string[] = [];
    for (const tag of counts.keys()) if (!chosen.includes(tag) && fits(tag)) others.push(tag);
    others.sort((a, b) => counts.get(b)! - counts.get(a)! || (a < b ? -1 : a > b ? 1 : 0));
    return [...chosen.filter(fits), ...others];
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
