import { createMemo, For, Show } from 'solid-js';

import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import type { ValueType } from '@/shared/shared-types';

import { clearTypes, getTypeFilter, toggleType } from '../../store-helpers/search-state';
import { CheckRow } from './CheckRow';

/** The types of the results, most common first; a chosen type stays in the list when it has none */
interface Props {
  /** How many of what was found have each type */
  typeCounts: Partial<Record<ValueType, number>>;
}

export function TypeFilter(props: Props) {
  const types = createMemo(() => {
    const counts = props.typeCounts;
    const all = new Set<ValueType>([...(Object.keys(counts) as ValueType[]), ...getTypeFilter()]);
    return [...all].toSorted((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b));
  });

  return (
    <div class="flex flex-col">
      <Show when={getTypeFilter().length}>
        <button
          type="button"
          class="cursor-pointer self-end px-1 text-xs text-sky-400 hover:underline"
          onClick={() => clearTypes()}
        >
          Show all types
        </button>
      </Show>
      <For each={types()} fallback={<p class="px-1 text-sm text-slate-400">No results</p>}>
        {(type) => (
          <CheckRow
            checked={getTypeFilter().includes(type)}
            onChange={() => toggleType(type)}
            count={props.typeCounts[type] ?? 0}
          >
            <TypeIcon type={type} /> {type}
          </CheckRow>
        )}
      </For>
    </div>
  );
}
