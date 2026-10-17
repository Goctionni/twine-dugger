import { For, Match, Show, Switch } from 'solid-js';

import { Dropdown } from '@/devtools-panel/ui/display/Dropdown';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import type { ValueType } from '@/shared/shared-types';

import { toolbarControl } from './toolbarControl';

export type TypeFilterVariant = 'minimal' | 'labels' | 'full';

interface Props {
  variant: TypeFilterVariant;
  types: ValueType[];
  hiddenTypes: ValueType[];
  onChange: (hiddenTypes: ValueType[]) => void;
}

export function TypeFilter(props: Props) {
  const isShown = (type: ValueType) => !props.hiddenTypes.includes(type);
  const toggle = (type: ValueType) =>
    props.onChange(
      isShown(type) ? [...props.hiddenTypes, type] : props.hiddenTypes.filter((t) => t !== type),
    );

  return (
    <Switch>
      <Match when={props.variant === 'full'}>
        <TypeChips types={props.types} isShown={isShown} onToggle={toggle} />
      </Match>
      <Match when={props.variant !== 'full'}>
        <TypeDropdown
          showLabel={props.variant === 'labels'}
          types={props.types}
          isShown={isShown}
          onToggle={toggle}
          hiddenCount={props.hiddenTypes.length}
          onShowAll={() => props.onChange([])}
        />
      </Match>
    </Switch>
  );
}

interface TypeChipsProps {
  types: ValueType[];
  isShown: (type: ValueType) => boolean;
  onToggle: (type: ValueType) => void;
}

function TypeChips(props: TypeChipsProps) {
  return (
    <div role="group" aria-label="Types" class="flex shrink-0 gap-1">
      <For each={props.types}>
        {(type) => (
          <button
            type="button"
            class={[
              toolbarControl,
              'inline-flex cursor-pointer items-center px-1.5',
              props.isShown(type)
                ? 'border-sky-600 bg-sky-950'
                : 'border-gray-600 opacity-50 hover:opacity-80',
            ]}
            title={type}
            aria-pressed={props.isShown(type) ? 'true' : 'false'}
            onClick={() => props.onToggle(type)}
          >
            <TypeIcon type={type} />
          </button>
        )}
      </For>
    </div>
  );
}

interface TypeDropdownProps extends TypeChipsProps {
  showLabel: boolean;
  hiddenCount: number;
  onShowAll: () => void;
}

function TypeDropdown(props: TypeDropdownProps) {
  return (
    <Dropdown
      align="end"
      label="Types"
      triggerClass={[
        toolbarControl,
        'relative inline-flex shrink-0 cursor-pointer items-center gap-1 px-2 hover:bg-gray-700',
        props.hiddenCount > 0 && 'border-sky-500',
      ]}
      trigger={
        <>
          <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
            filter_alt
          </span>
          <Show when={props.showLabel}>
            <span class="[text-box:trim-both_ex_alphabetic]">Types</span>
          </Show>
          <span aria-hidden="true">▾</span>
          {/* How many types are hidden */}
          <Show when={props.hiddenCount > 0}>
            <b
              class="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-amber-400 px-1 text-center text-[10px] leading-4 text-black"
              title={`${props.hiddenCount} hidden`}
            >
              {props.hiddenCount}
            </b>
          </Show>
        </>
      }
    >
      {() => (
        <>
          <For each={props.types}>
            {(type) => (
              <button
                type="button"
                class="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-700"
                onClick={() => props.onToggle(type)}
              >
                <TypeIcon type={type} />
                <span class="flex-1 capitalize">{type}</span>
                <span
                  aria-hidden="true"
                  class="material-symbols-outlined w-4 text-base leading-none"
                >
                  {props.isShown(type) ? 'check' : ''}
                </span>
              </button>
            )}
          </For>
          <Show when={props.hiddenCount > 0}>
            <button
              type="button"
              class="mt-1 w-full cursor-pointer rounded border-t border-gray-700 px-2 py-1 text-left text-sm text-sky-300 hover:bg-gray-700"
              onClick={() => props.onShowAll()}
            >
              Show all types
            </button>
          </Show>
        </>
      )}
    </Dropdown>
  );
}
