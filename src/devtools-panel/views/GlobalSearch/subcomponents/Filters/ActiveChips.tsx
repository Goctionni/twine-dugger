import type { JSX } from '@solidjs/web';
import { For, Show } from 'solid-js';

import {
  getScope,
  getSort,
  getTagFilter,
  getTypeFilter,
  hasActiveFilters,
  resetFilters,
  setPassageSort,
  setStateSort,
  togglePassageScope,
  toggleStateScope,
  toggleTag,
  toggleType,
} from '../../store-helpers/search-state';
import { createDefaultSort } from '../../types';

const defaultSort = createDefaultSort();

function Chip(props: { onRemove: () => void; children: JSX.Element }) {
  return (
    <button
      type="button"
      class="cursor-pointer rounded-full bg-sky-900 px-2 py-0.5 text-xs hover:bg-sky-800"
      title="Take away"
      onClick={() => props.onRemove()}
    >
      {props.children} ✕
    </button>
  );
}

/** What is not how it starts out, each with a button to take it away */
export function ActiveChips() {
  return (
    <Show when={hasActiveFilters()}>
      <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-700 p-1.5">
        {/* Scope: State */}
        <Show when={!getScope().state.path}>
          <Chip onRemove={() => toggleStateScope('path')}>Not in path</Chip>
        </Show>
        <Show when={!getScope().state.value}>
          <Chip onRemove={() => toggleStateScope('value')}>Not in value</Chip>
        </Show>
        {/* Scope: Passage */}
        <Show when={!getScope().passage.name}>
          <Chip onRemove={() => togglePassageScope('name')}>Not in name</Chip>
        </Show>
        <Show when={!getScope().passage.tags}>
          <Chip onRemove={() => togglePassageScope('tags')}>Not in tags</Chip>
        </Show>
        <Show when={!getScope().passage.content}>
          <Chip onRemove={() => togglePassageScope('content')}>Not in content</Chip>
        </Show>
        {/* Sort */}
        <Show when={getSort().state !== defaultSort.state}>
          <Chip onRemove={() => setStateSort(defaultSort.state)}>State sorted</Chip>
        </Show>
        <Show when={getSort().passage !== defaultSort.passage}>
          <Chip onRemove={() => setPassageSort(defaultSort.passage)}>Passages sorted</Chip>
        </Show>
        {/* Filters */}
        <For each={getTypeFilter()}>
          {(type) => <Chip onRemove={() => toggleType(type)}>{type}</Chip>}
        </For>
        <For each={getTagFilter()}>
          {(tag) => <Chip onRemove={() => toggleTag(tag)}>#{tag}</Chip>}
        </For>
        <button
          type="button"
          class="cursor-pointer rounded-full px-2 py-0.5 text-xs text-sky-400 hover:bg-slate-700"
          onClick={() => resetFilters()}
        >
          Reset all
        </button>
      </div>
    </Show>
  );
}
