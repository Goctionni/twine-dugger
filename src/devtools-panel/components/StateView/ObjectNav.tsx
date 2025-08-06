import { For, Show } from 'solid-js';
import { PathChunk } from './types';
import { TypeIcon } from './TypeIcon';
import clsx from 'clsx';

interface Props {
  chunk: PathChunk;
  selectedProperty?: string | number;
  dataPropertyPath: (string | number)[];
  duplicatingProperty: string | null;
  duplicateName: string;
  setDuplicateName: (value: string) => void;
  onDuplicateSave: () => void;
  onClick: (childKey: string | number) => void;
}

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function ObjectNav(props: Props) {
  return (
    <div class="min-w-[200px] flex flex-col h-full px-2 border-r border-r-gray-700">
      <p class="text-lg">{props.chunk.name}</p>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={props.chunk.childKeys}>
          {(child) => (
            <>
              <li>
                <a
                  data-property={child.text}
                  on:click={() => props.onClick(child.text)}
                  class={clsx(
                    'flex items-center gap-1 p-1 cursor-pointer rounded-md',
                    child.text === props.selectedProperty
                      ? 'outline-gray-300 outline-2 -outline-offset-2'
                      : 'outline-transparent hover:bg-gray-700',
                  )}
                >
                  <TypeIcon type={child.type} />
                  <span class="flex-1 overflow-hidden overflow-ellipsis">{child.text}</span>
                </a>
              </li>
              <Show when={props.duplicatingProperty === child.text}>
                <li class="flex items-center gap-2 px-2 py-1">
                  <input
                    class="border rounded px-2 py-1 text-sm bg-gray-800 text-white flex-1"
                    value={props.duplicateName}
                    onInput={(e) => props.setDuplicateName(e.currentTarget.value)}
                  />
                  <button
                    type="button"
                    onClick={props.onDuplicateSave}
                    class={clsx(
                      buttonClasses,
                      'text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 whitespace-nowrap',
                    )}
                  >
                    Save
                  </button>
                </li>
              </Show>
            </>
          )}
        </For>
      </ul>
    </div>
  );
}
