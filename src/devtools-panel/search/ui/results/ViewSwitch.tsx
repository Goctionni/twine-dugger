import clsx from 'clsx';
import { For } from 'solid-js';

import { useSearch } from '../../model/context';
import { getView, setView, type ResultsView } from './results-view';

/** Both sections, or only one of them */
export function ViewSwitch() {
  const search = useSearch();
  const options: Array<{ view: ResultsView; label: () => string }> = [
    { view: 'both', label: () => 'Both' },
    { view: 'state', label: () => `State · ${search.hasQuery() ? search.stateTotal() : '–'}` },
    {
      view: 'passage',
      label: () => `Passages · ${search.hasQuery() ? search.passageTotal() : '–'}`,
    },
  ];

  return (
    <div class="flex gap-px border-b border-slate-700 p-1.5" role="group" aria-label="Show">
      <For each={options}>
        {(option) => (
          <button
            type="button"
            class={clsx(
              'cursor-pointer px-3 py-1 text-xs first:rounded-l-sm last:rounded-r-sm',
              getView() === option.view
                ? 'bg-sky-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700',
            )}
            aria-pressed={getView() === option.view ? 'true' : 'false'}
            onClick={() => setView(option.view)}
          >
            {option.label()}
          </button>
        )}
      </For>
    </div>
  );
}
