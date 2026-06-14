import clsx from 'clsx';
import { For, untrack, createSignal } from 'solid-js';

import { tooltip } from '@/devtools-panel/ui/display/TooltipDirective';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import type { OrderConfig, PropertyOrder } from '@/shared/shared-types';

interface PrimarySortOption {
  key: PropertyOrder;
  label: string;
  tooltip: string;
  icon: string;
  class?: string;
}

const primarySortOptions: PrimarySortOption[] = [
  {
    key: 'type',
    label: 'Type',
    tooltip: 'Sort by type of property value',
    icon: 'category',
    class: 'bg-yellow-600',
  },
  {
    key: 'alphabetic',
    label: 'Name',
    tooltip: 'Sort alphabetically by property name',
    icon: 'abc',
    class: 'bg-sky-600',
  },
  {
    key: 'most-recent',
    label: 'Updated',
    tooltip: 'Sort by most recently changed property',
    icon: 'history',
    class: 'bg-fuchsia-600',
  },
  {
    key: 'none',
    label: 'None',
    tooltip: 'Do not sort properties (maintain original order)',
    icon: 'block',
    class: 'bg-slate-600',
  },
];

interface Props extends OrderConfig {
  onConfirm: (config: OrderConfig) => void;
}

export function SortPropertiesDialog(props: Props) {
  const initialSort = untrack(() => props.orderBy ?? 'none');
  const initialDirection = untrack(() => (props.descending ? 'desc' : 'asc'));

  const [selectedOption, setSelectedOption] = createSignal<PropertyOrder>(initialSort);
  const [selectedDirection, setSelectedDirection] = createSignal<'asc' | 'desc'>(initialDirection);

  function handleSubmit(e: Event) {
    e.preventDefault();
    props.onConfirm({
      orderBy: selectedOption(),
      descending: selectedDirection() === 'desc',
    });
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col">
      <div class="my-3 flex flex-col gap-2">
        <For each={primarySortOptions}>
          {(option) => (
            <label
              use:tooltip={option.tooltip}
              class={clsx(
                `group cursor-pointer select-none`,
                `flex items-center gap-3`,
                `rounded-md border border-slate-800 bg-slate-950/20 p-2 text-slate-400`,
                `transition-all duration-150`,
                `hover:border-slate-700 hover:bg-slate-900/50`,
                `has-checked:border-sky-600 has-checked:bg-slate-900/90 has-checked:text-slate-100`,
              )}
            >
              <input
                type="radio"
                name="primary-sort"
                class="peer sr-only"
                checked={selectedOption() === option.key}
                onChange={() => setSelectedOption(option.key)}
              />

              <div class={clsx(`
                material-symbols-outlined flex h-8 w-8 shrink-0 items-center justify-center rounded text-lg text-slate-200 opacity-40 saturate-0 transition-all duration-150 select-none group-hover:saturate-50 peer-checked:opacity-100 peer-checked:saturate-100`, option.class)}>{option.icon}</div>

              <span class="text-sm font-semibold tracking-wide">{option.label}</span>
            </label>
          )}
        </For>
      </div>

      <div class="my-2 border-t border-slate-400" />

      <div class="mb-5 grid grid-cols-2 gap-2">
        <label
          use:tooltip="Sort in ascending order"
          class={clsx(
            `group cursor-pointer select-none`,
            `flex items-center gap-3`,
            `rounded-md border border-slate-800 bg-slate-950/20 p-2 text-slate-400`,
            `transition-all duration-150`,
            `hover:border-slate-700 hover:bg-slate-900/50`,
            `has-checked:border-sky-600 has-checked:bg-slate-900/90 has-checked:text-slate-100`,
            selectedOption() === 'none' && `pointer-events-none cursor-not-allowed opacity-30`,
          )}
        >
          <input
            type="radio"
            name="sort-direction"
            class="peer sr-only"
            disabled={selectedOption() === 'none'}
            checked={selectedDirection() === 'asc'}
            onChange={() => setSelectedDirection('asc')}
          />
          <div class="material-symbols-outlined flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-700 text-lg text-green-400 opacity-40 saturate-0 transition-all duration-150 select-none group-hover:saturate-50 peer-checked:opacity-100 peer-checked:saturate-100">
            arrow_upward
          </div>
          <span class="text-sm font-semibold tracking-wide">Ascending</span>
        </label>

        <label
          use:tooltip="Sort in descending order"
          class={clsx(
            `group cursor-pointer select-none`,
            `flex items-center gap-3`,
            `rounded-md border border-slate-800 bg-slate-950/20 p-2 text-slate-400`,
            `transition-all duration-150`,
            `hover:border-slate-700 hover:bg-slate-900/50`,
            `has-checked:border-sky-600 has-checked:bg-slate-900/90 has-checked:text-slate-100`,
            selectedOption() === 'none' && `pointer-events-none cursor-not-allowed opacity-30`,
          )}
        >
          <input
            type="radio"
            name="sort-direction"
            class="peer sr-only"
            disabled={selectedOption() === 'none'}
            checked={selectedDirection() === 'desc'}
            onChange={() => setSelectedDirection('desc')}
          />
          <div class="material-symbols-outlined flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-700 text-lg text-red-400 opacity-40 saturate-0 transition-all duration-150 select-none group-hover:saturate-50 peer-checked:opacity-100 peer-checked:saturate-100">
            arrow_downward
          </div>
          <span class="text-sm font-semibold tracking-wide">Descending</span>
        </label>
      </div>

      <button type="submit" class={btnClass('contained')}>
        Save sorting
      </button>
    </form>
  );
}

/* TODO:
- Use fieldsets for the radio groups
- Figure if we can/should move the radio/checkboxes into deparate components
*/
