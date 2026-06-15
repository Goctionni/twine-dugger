import clsx from 'clsx';
import { For, untrack, createSignal, Switch, Match } from 'solid-js';

import { tooltip } from '@/devtools-panel/ui/display/TooltipDirective';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import type { PropertyFilterKey, ValueType } from '@/shared/shared-types';

interface FilterOption {
  key: PropertyFilterKey;
  label: string;
  tooltip: string;
}

const allFilters: FilterOption[] = [
  {
    key: 'map',
    label: 'Map',
    tooltip: 'Show properties containing a Map',
  },
  {
    key: 'object',
    label: 'Object',
    tooltip: 'Show properties containing an Object',
  },
  {
    key: 'set',
    label: 'Set',
    tooltip: 'Show properties containing a Set',
  },
  {
    key: 'array',
    label: 'Array',
    tooltip: 'Show properties containing an Array',
  },
  {
    key: 'string',
    label: 'String',
    tooltip: 'Show properties of type String',
  },
  {
    key: 'number',
    label: 'Number',
    tooltip: 'Show properties of type Number',
  },
  {
    key: 'boolean',
    label: 'Boolean',
    tooltip: 'Show properties of type Boolean',
  },
  {
    key: 'null',
    label: 'Null',
    tooltip: 'Show properties with Null values',
  },
  {
    key: 'undefined',
    label: 'Undefined',
    tooltip: 'Show properties that are Undefined',
  },
  {
    key: 'function',
    label: 'Function',
    tooltip: 'Show properties of type Function',
  },
  {
    key: 'other',
    label: 'Other',
    tooltip: 'Show properties of other types',
  },
  {
    key: 'filtered',
    label: 'Filtered',
    tooltip: 'Show filtered properties',
  },
];

export function FilterPropertiesDialog(props: {
  onConfirm: (filters: PropertyFilterKey[]) => void;
  filters: PropertyFilterKey[];
}) {
  const initialFilters = untrack(() => props.filters);
  const filters = allFilters.map((filter) => {
    const enabled = initialFilters.includes(filter.key);
    const [checked, setChecked] = createSignal(!enabled);
    return {
      ...filter,
      checked,
      toggle: () => setChecked((cur) => !cur),
    };
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    props.onConfirm(filters.filter((filter) => !filter.checked()).map((filter) => filter.key));
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col">
      <fieldset class="my-5 grid grid-cols-3 gap-2">
        <legend class="sr-only">What properties to show</legend>
        <For each={filters}>
          {(filter) => (
            <label
              use:tooltip={filter.tooltip}
              class={clsx(
                `group cursor-pointer select-none`,
                `flex items-center gap-2`,
                `rounded-md border border-slate-800 bg-slate-950/20 p-1 text-slate-400`,
                `transition-all duration-150`,
                `hover:border-slate-700 hover:bg-slate-900/50`,
                `has-checked:border-sky-600 has-checked:bg-slate-900/90 has-checked:text-slate-100`,
              )}
            >
              <input
                type="checkbox"
                class="peer sr-only"
                checked={filter.checked()}
                onChange={() => filter.toggle()}
              />

              <div class="shrink-0 opacity-40 saturate-0 transition-all duration-150 peer-checked:opacity-100 peer-checked:saturate-100">
                <Switch>
                  <Match when={filter.key === 'filtered'}>
                    <div
                      class={clsx(
                        'material-symbols-outlined rounded bg-slate-700 text-xs text-slate-200 select-none',
                        'flex items-center justify-center',
                        'h-5 w-5',
                      )}
                    >
                      filter_alt
                    </div>
                  </Match>
                  <Match when={filter.key === 'other'}>
                    <div
                      class="
                      material-symbols-outlined flex h-5
                      w-5 items-center justify-center
                      rounded
                      bg-fuchsia-900 text-xs font-bold text-slate-200 select-none"
                    >
                      asterisk
                    </div>
                  </Match>
                  <Match when={filter.key !== 'filtered' && filter.key !== 'other'}>
                    <TypeIcon type={filter.key as ValueType} />
                  </Match>
                </Switch>
              </div>
              <span class="text-xs font-semibold tracking-wide">{filter.label}</span>
            </label>
          )}
        </For>
      </fieldset>

      <button type="submit" class={btnClass('contained')}>
        Save filters
      </button>
    </form>
  );
}
