import { For } from 'solid-js';
import { PathChunk } from './types';
import { TypeIcon } from './TypeIcon';
import clsx from 'clsx';

interface Props {
  chunk: PathChunk;
  onClick: (childKey: string | number) => void;
}

export function ObjectNav(props: Props) {
  return (
    <div class="w-max max-w-3xs flex flex-col h-full">
      <p class="text-lg">{props.chunk.name}</p>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={props.chunk.childKeys}>
          {(child) => (
            <li class="pr-1">
              <a
                on:click={() => props.onClick(child.text)}
                class={clsx(
                  'flex items-center gap-1 p-1 cursor-pointer rounded-md',
                  child.text === props.chunk.selectedChildKey
                    ? 'outline-gray-300 outline-2 -outline-offset-2'
                    : 'outline-transparent hover:bg-gray-700',
                )}
              >
                <TypeIcon type={child.type} />
                {child.text}
              </a>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
