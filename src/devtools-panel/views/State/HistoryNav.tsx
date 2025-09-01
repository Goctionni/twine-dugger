import clsx from 'clsx';
import { createMemo, For } from 'solid-js';

import { createGetViewState, getHistoryIds, setViewState } from '../../store';

interface HistoryNode {
  text: string;
  active: boolean;
  onClick: () => void;
}

export function HistoryNav() {
  const getHistoryId = createGetViewState('state', 'historyId');

  const items = createMemo(() => {
    const historyId = getHistoryId();
    return getHistoryIds().map((id, index): HistoryNode => {
      return {
        text: index === 0 ? 'latest' : `-${index}`,
        active: id === historyId || (historyId === -1 && index === 0),
        onClick: () => setViewState('state', 'historyId', index ? id : -1),
      };
    });
  });

  return (
    <div class="flex gap-4 items-center justify-start p-2">
      <span class="text-lg font-bold">History slice:</span>
      <ul class="flex justify-center items-center gap-2">
        <For each={items()}>
          {(item, index) => {
            return (
              <li>
                <button class="cursor-pointer" onClick={item.onClick}>
                  <div
                    class={clsx('px-1 rounded-full outline text-xs', {
                      'outline-2 outline-offset-2': item.active,
                    })}
                  >
                    {item.text}
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
