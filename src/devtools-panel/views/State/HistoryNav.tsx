import clsx from 'clsx';
import { For } from 'solid-js';

import { createGetViewState, getHistoryIds, getLatestId, setViewState } from '../../store/store';

const getHistoryRef = createGetViewState('state', 'historyRef');

export function HistoryNav() {
  return (
    <div class="flex items-center justify-start gap-4 p-2">
      <span class="text-lg font-bold">History slice:</span>
      <ul class="flex items-center justify-center gap-2">
        <For each={getHistoryIds()}>{(id) => <HistoryItem id={id} />}</For>
      </ul>
    </div>
  );
}

// Slices are identified by the id of the diff that produced them, so a row keeps its identity
// when new diffs arrive; only its "-N" label moves.
function HistoryItem(props: { id: number }) {
  const offset = () => getLatestId() - props.id;
  const active = () => {
    const ref = getHistoryRef();
    return ref === props.id || (ref === 'latest' && offset() === 0);
  };

  return (
    <li>
      <button
        class="cursor-pointer"
        onClick={() => setViewState('state', 'historyRef', offset() === 0 ? 'latest' : props.id)}
      >
        <div
          class={clsx('rounded-full px-1 text-xs outline', {
            'outline-2 outline-offset-2': active(),
          })}
        >
          {offset() === 0 ? 'latest' : `-${offset()}`}
        </div>
      </button>
    </li>
  );
}
