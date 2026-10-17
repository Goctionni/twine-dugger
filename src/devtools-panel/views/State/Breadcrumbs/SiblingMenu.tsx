import { For } from 'solid-js';

interface Props {
  current: string;
  siblings: string[];
}

/**
 * A native popover, so the browser takes care of opening, closing and the top layer. It opens
 * below the crumb it belongs to (the `--crumb` anchor of `BreadcrumbItem`), aligned with its start
 */
export function SiblingMenu(props: Props) {
  const id = `siblings-${crypto.randomUUID()}`;

  return (
    <>
      <button
        type="button"
        popovertarget={id}
        class="cursor-pointer pr-2 text-gray-400 hover:text-white"
        aria-label={`Siblings of ${props.current}`}
      >
        ▾
      </button>
      <div
        id={id}
        popover
        class="inset-auto max-h-64 min-w-40 overflow-auto rounded-b-md border border-gray-700 bg-gray-800 p-1 text-gray-200 shadow-lg [position-anchor:--crumb] [position-area:bottom_span-right] [position-try-fallbacks:flip-block,flip-inline]"
      >
        <For each={props.siblings}>
          {(name) => (
            <button
              type="button"
              popovertarget={id}
              popovertargetaction="hide"
              class={[
                'block w-full cursor-pointer rounded px-2 py-1 text-left font-mono text-xs hover:bg-gray-700',
                name === props.current ? 'text-sky-300' : 'text-gray-200',
              ]}
            >
              {name}
            </button>
          )}
        </For>
      </div>
    </>
  );
}
