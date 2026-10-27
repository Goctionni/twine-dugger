import { createMemo, For, Show } from 'solid-js';

import { clearLocks, getLock, getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import { showInStatePage } from '@/devtools-panel/store/state-location';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { sortPaths } from '@/shared/path-sorter';
import type { Lock, Path } from '@/shared/shared-types';

import { btnClass } from '../../../ui/util/btnClass';
import { formatAsJson } from '../../State/Inspector/logic/info';

/** Where the path is held: at a value, or within the range of a number */
function describeLock(lock: Lock) {
  return lock.min !== undefined && lock.max !== undefined
    ? { word: 'within', text: `${lock.min} – ${lock.max}` }
    : { word: 'at', text: formatAsJson(lock.value, 40) };
}

export function LockSettings() {
  const onUnlock = (path: Path) => setPathLock(path, false);

  const onClearAll = () => {
    if (lockedPaths().length) clearLocks();
  };

  const lockedPaths = createMemo(() => sortPaths(getLockedPaths()));

  return (
    <section class="rounded-md border border-gray-700 bg-gray-800/40 p-3">
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="text-sm text-gray-300">
          Locked paths: <span class="font-semibold text-gray-100">{lockedPaths().length}</span>
        </p>
        <button
          type="button"
          class={btnClass('outline', 'clr-gray hover:clr-sky px-2 py-0.5 text-xs')}
          onClick={onClearAll}
          disabled={!lockedPaths().length}
        >
          Clear all
        </button>
      </div>

      <Show
        when={lockedPaths().length > 0}
        fallback={<p class="text-sm text-gray-400">No locked variables yet.</p>}
      >
        <ul class="max-h-64 space-y-2 overflow-auto pr-1">
          <For each={lockedPaths()}>
            {(path) => (
              <li class="flex items-center gap-2 rounded border border-gray-700 bg-gray-900/70 px-2 py-1">
                <button
                  type="button"
                  title="Show in State view"
                  class="min-w-0 flex-1 cursor-pointer text-left hover:underline"
                  onClick={() => showInStatePage(path)}
                >
                  <PrettyPath path={path} class="font-mono text-xs break-all" />
                </button>
                <Show when={getLock(path)}>
                  {(lock) => (
                    <span class="shrink-0 font-mono text-xs text-gray-400">
                      {describeLock(lock()).word}{' '}
                      <span class="text-sky-300">{describeLock(lock()).text}</span>
                    </span>
                  )}
                </Show>
                <button
                  type="button"
                  class={btnClass('outline', 'clr-gray hover:clr-sky px-2 py-0.5 text-xs')}
                  onClick={() => onUnlock(path)}
                >
                  Unlock
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
