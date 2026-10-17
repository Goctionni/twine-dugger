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
  const select = (sort: Sort, close: () => void) => {
    props.onChange(sort);
    close();
  };

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
        <>
          <SortOption isActive={props.sort === 'name'} onClick={() => select('name', close)}>
            Name
          </SortOption>
          <SortOption isActive={props.sort === 'type'} onClick={() => select('type', close)}>
            Type
          </SortOption>
          <SortOption isActive={props.sort === 'changed'} onClick={() => select('changed', close)}>
            Recently changed
          </SortOption>
        </>
      )}
    </Dropdown>
  );
}

interface SortOptionProps {
  isActive: boolean;
  onClick: () => void;
  children: JSX.Element;
}

function SortOption(props: SortOptionProps) {
  return (
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-700"
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true" class="material-symbols-outlined w-4 text-base leading-none">
        {props.isActive ? 'check' : ''}
      </span>
      {props.children}
    </button>
  );
}
