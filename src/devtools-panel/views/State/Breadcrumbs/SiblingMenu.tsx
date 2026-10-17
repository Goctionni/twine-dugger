import { For } from 'solid-js';

import { Dropdown } from '@/devtools-panel/ui/display/Dropdown';

interface Props {
  current: string;
  siblings: string[];
}

/** Opens below the crumb it belongs to (the `--crumb` anchor of `BreadcrumbItem`), aligned with its start */
export function SiblingMenu(props: Props) {
  return (
    <Dropdown
      trigger="▾"
      label={`Siblings of ${props.current}`}
      triggerClass="cursor-pointer pr-2 text-gray-400 hover:text-white"
      menuClass="[position-anchor:--crumb]"
    >
      {(close) => (
        <For each={props.siblings}>
          {(name) => (
            <button
              type="button"
              onClick={close}
              class={[
                'block w-full cursor-pointer rounded px-2 py-1 text-left font-mono text-xs hover:bg-gray-700',
                name === props.current ? 'text-sky-300' : 'text-gray-200',
              ]}
            >
              {name}
            </button>
          )}
        </For>
      )}
    </Dropdown>
  );
}
