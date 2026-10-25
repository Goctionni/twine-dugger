import { Show } from 'solid-js';

import { createElementWidth } from '@/devtools-panel/utils/create-element-width';

import { toolbarControl } from './toolbarControl';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput(props: Props) {
  let wrapper: HTMLDivElement | undefined;
  let input!: HTMLInputElement;
  const getWidth = createElementWidth(() => wrapper);
  const hasText = () => props.value !== '';
  const isWide = () => getWidth() >= 150;

  return (
    <div ref={wrapper} class="relative min-w-15 flex-1">
      <input
        ref={input}
        type="text"
        aria-label="Filter"
        placeholder="Filter…"
        class={[
          toolbarControl,
          'w-full bg-gray-700 pl-2 outline-none focus:border-sky-500',
          {
            'pr-2': !hasText(),
            'pr-8': hasText() && !isWide(),
            'pr-16': hasText() && isWide(),
          },
        ]}
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && props.value) {
            e.preventDefault();
            props.onChange('');
          }
        }}
      />
      <Show when={props.value}>
        <button
          type="button"
          aria-label="Clear filter"
          title="Clear filter"
          class={[
            'absolute top-0 right-0 flex h-full cursor-pointer items-center justify-center rounded-r-md border border-gray-400 bg-gray-500 text-xs font-medium text-white hover:border-sky-400 hover:bg-sky-600',
            isWide() ? 'px-2' : 'w-7',
          ]}
          onClick={() => {
            props.onChange('');
            input.focus();
          }}
        >
          <Show
            when={isWide()}
            fallback={
              <span aria-hidden="true" class="material-symbols-outlined text-base leading-none">
                close
              </span>
            }
          >
            Clear
          </Show>
        </button>
      </Show>
    </div>
  );
}
