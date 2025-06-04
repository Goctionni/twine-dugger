import clsx from 'clsx';
import { HistoryNode } from './StateView/watchState/types';
import { For } from 'solid-js';

interface Props {
  historyItems: HistoryNode[];
  setHistoryId: (historyId: 'latest' | number) => void;
}

export function HistoryNav(props: Props) {
  return (
    <div class="flex gap-4 items-center justify-start p-2">
      <span class="text-lg font-bold">History slice:</span>
      <ul class="flex justify-center items-center gap-2">
        <For each={props.historyItems.toReversed()}>
          {(item, index) => {
            return (
              <li>
                <button class="cursor-pointer" onClick={() => props.setHistoryId(item.id)}>
                  <div
                    class={clsx('px-1 rounded-full outline text-xs', {
                      'outline-2 outline-offset-2': item.active,
                    })}
                  >
                    {item.id === 'latest' ? 'current' : `-${index()}`}
                  </div>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
    </div>
  );
}
