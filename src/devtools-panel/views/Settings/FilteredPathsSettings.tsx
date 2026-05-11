import { For, Show } from 'solid-js';

import { clearFilteredPaths, getFilteredPaths, removeFilteredPath } from '@/devtools-panel/store';
import { Path } from '@/shared/shared-types';

import { btnClass } from '../../ui/util/btnClass';

const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function formatPath(path: Path) {
  return path.reduce((formatted, chunk) => {
    if (typeof chunk === 'number') return `${formatted}[${chunk}]`;
    if (identifierRegex.test(chunk)) return `${formatted}.${chunk}`;
    return `${formatted}[${JSON.stringify(chunk)}]`;
  }, 'State');
}

export function FilteredPathsSettings() {
  return (
    <section class="rounded-md border border-gray-700 bg-gray-800/40 p-3">
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="text-sm text-gray-300">
          Filtered paths:{' '}
          <span class="font-semibold text-gray-100">{getFilteredPaths().length}</span>
        </p>
        <button
          type="button"
          class={btnClass('clr-gray hover:clr-sky py-0.5 px-2 text-xs')}
          onClick={() => clearFilteredPaths()}
          disabled={!getFilteredPaths().length}
        >
          Clear all
        </button>
      </div>

      <Show
        when={getFilteredPaths().length > 0}
        fallback={<p class="text-sm text-gray-400">No filtered paths yet.</p>}
      >
        <ul class="max-h-64 space-y-2 overflow-auto pr-1">
          <For each={getFilteredPaths()}>
            {(path) => (
              <li class="flex items-center gap-2 rounded border border-gray-700 bg-gray-900/70 px-2 py-1">
                <span class="min-w-0 flex-1 break-all font-mono text-xs text-sky-300">
                  {formatPath(path)}
                </span>
                <button
                  type="button"
                  class={btnClass('clr-gray hover:clr-sky py-0.5 px-2 text-xs')}
                  onClick={() => removeFilteredPath(path)}
                >
                  Remove
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}