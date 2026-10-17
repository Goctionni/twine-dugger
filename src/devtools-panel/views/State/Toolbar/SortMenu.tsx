import type { JSX } from '@solidjs/web';
import { Show } from 'solid-js';

import { Dropdown } from '@/devtools-panel/ui/display/Dropdown';

import type { Sort } from '../types';
import { toolbarControl } from './toolbarControl';

type SortMenuVariant = 'minimal' | 'labels';

interface Props {
  variant: SortMenuVariant;
  sort: Sort;
  onChange: (sort: Sort) => void;
}

export function SortMenu(props: Props) {
  const name = `sort-${crypto.randomUUID()}`;

  return (
    <Dropdown
      align="end"
      label="Sort"
      triggerClass={[
        toolbarControl,
        'inline-flex shrink-0 cursor-pointer items-center gap-1 px-2 hover:bg-gray-700',
      ]}
      trigger={
        <>
          <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
            swap_vert
          </span>
          <Show when={props.variant === 'labels'}>
            <span class="[text-box:trim-both_ex_alphabetic]">Sort</span>
          </Show>
          <span aria-hidden="true">▾</span>
        </>
      }
    >
      {(close) => (
        <fieldset>
          <legend class="sr-only">Sort by</legend>
          <SortOption
            name={name}
            isChecked={props.sort === 'name'}
            onSelect={() => props.onChange('name')}
            close={close}
          >
            Name
          </SortOption>
          <SortOption
            name={name}
            isChecked={props.sort === 'type'}
            onSelect={() => props.onChange('type')}
            close={close}
          >
            Type
          </SortOption>
          <SortOption
            name={name}
            isChecked={props.sort === 'changed'}
            onSelect={() => props.onChange('changed')}
            close={close}
          >
            Recently changed
          </SortOption>
        </fieldset>
      )}
    </Dropdown>
  );
}

interface SortOptionProps {
  name: string;
  isChecked: boolean;
  onSelect: () => void;
  close: () => void;
  children: JSX.Element;
}

function SortOption(props: SortOptionProps) {
  return (
    <label class="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-700 has-focus-visible:bg-gray-700">
      <input
        type="radio"
        name={props.name}
        class="peer sr-only"
        checked={props.isChecked}
        onChange={() => props.onSelect()}
        // Also for the option that is already chosen. The arrow keys click as well, and those keep
        // the menu open (a click of the pointer has a detail, one of the keyboard has none)
        onClick={(event) => event.detail && props.close()}
      />
      <span
        aria-hidden="true"
        class="material-symbols-outlined w-4 text-base leading-none opacity-0 peer-checked:opacity-100"
      >
        check
      </span>
      {props.children}
    </label>
  );
}
