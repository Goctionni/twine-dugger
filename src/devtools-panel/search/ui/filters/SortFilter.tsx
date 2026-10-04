import { For } from 'solid-js';

import type { PassageSort, StateSort } from '../../core/types';
import { getSort, setPassageSort, setStateSort } from '../../model/search-state';

const stateSorts: Array<[StateSort, string]> = [
  ['source', 'Source order'],
  ['path-asc', 'Path A–Z'],
  ['path-desc', 'Path Z–A'],
  ['type', 'Type'],
  ['recent', 'Recently changed'],
];
const passageSorts: Array<[PassageSort, string]> = [
  ['match', 'Best match (name first)'],
  ['most-matches', 'Most matches'],
  ['name-asc', 'Name A–Z'],
  ['name-desc', 'Name Z–A'],
];

const selectClass =
  'w-full cursor-pointer rounded-sm border border-slate-600 bg-slate-900 px-1.5 py-1 text-sm';
const titleClass = 'px-1 text-xs font-semibold text-slate-400 uppercase';

export function SortFilter() {
  return (
    <div class="flex flex-col gap-2">
      <label class="flex flex-col gap-0.5">
        <span class={titleClass}>State</span>
        <select
          class={selectClass}
          value={getSort().state}
          onChange={(event) => setStateSort(event.currentTarget.value as StateSort)}
        >
          <For each={stateSorts}>{([value, label]) => <option value={value}>{label}</option>}</For>
        </select>
      </label>
      <label class="flex flex-col gap-0.5">
        <span class={titleClass}>Passages</span>
        <select
          class={selectClass}
          value={getSort().passage}
          onChange={(event) => setPassageSort(event.currentTarget.value as PassageSort)}
        >
          <For each={passageSorts}>
            {([value, label]) => <option value={value}>{label}</option>}
          </For>
        </select>
      </label>
    </div>
  );
}
