import type { Sort, SortBy } from '../types';
import { toolbarControl } from './toolbarControl';

type SortMenuVariant = 'minimal' | 'labels';

interface Props {
  variant: SortMenuVariant;
  sort: Sort;
  onChange: (sort: Sort) => void;
}

const REVERSE_SUFFIX = '-reverse';

// The content of the select is static on purpose: a parser that does not know the customizable
// select (jsdom, an older browser) drops the button and the markup in the options, and a binding in
// them would have nothing to bind to. What changes is done through classes on the select.
export function SortMenu(props: Props) {
  const getValue = () => props.sort.by + (props.sort.isDescending ? REVERSE_SUFFIX : '');
  const onChange = (value: string) =>
    props.onChange({
      by: value.replace(REVERSE_SUFFIX, '') as SortBy,
      isDescending: value.endsWith(REVERSE_SUFFIX),
    });

  return (
    <select
      aria-label="Sort"
      title="Sort"
      class={[
        'base-select',
        toolbarControl,
        'inline-flex shrink-0 cursor-pointer px-2 hover:bg-gray-700 [&::picker(select)]:min-w-44! [&::picker(select)]:[position-area:bottom_span-left] [&::picker-icon]:hidden',
        { '[&_[data-sort-label]]:hidden': props.variant !== 'labels' },
      ]}
      value={getValue()}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      <button type="button" class="gap-1">
        <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
          swap_vert
        </span>
        <span data-sort-label class="[text-box:trim-both_ex_alphabetic]">
          Sort
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      <option value="name">Name</option>
      <option value="type">Type</option>
      <option value="changed">Recently changed</option>
      <hr class="my-1 border-gray-600" />
      <option value="name-reverse">
        Name <span class="text-gray-400">(Reverse)</span>
      </option>
      <option value="type-reverse">
        Type <span class="text-gray-400">(Reverse)</span>
      </option>
      <option value="changed-reverse">Least recently changed</option>
    </select>
  );
}
