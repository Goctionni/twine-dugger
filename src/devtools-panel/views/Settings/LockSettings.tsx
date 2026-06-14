import { For, Show } from 'solid-js';

import { setStatePropertyLock, setStatePropertyLocks } from '@/devtools-panel/api/api';
import { clearLockPaths, getLockedPaths, removeLockPath } from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import type { Path } from '@/shared/shared-types';

import { btnClass } from '../../ui/util/btnClass';

export function LockSettings() {
  const onUnlock = (path: Path) => {
    setStatePropertyLock(path, false);
    removeLockPath(path);
  };

  const onClearAll = () => {
    if (!getLockedPaths().length) return;
    setStatePropertyLocks([]);
    clearLockPaths();
  };

  return (
    <section class="rounded-md border border-gray-700 bg-gray-800/40 p-3">
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="text-sm text-gray-300">
          Locked paths: <span class="font-semibold text-gray-100">{getLockedPaths().length}</span>
        </p>
        <button
          type="button"
          class={btnClass('outline', 'clr-gray hover:clr-sky px-2 py-0.5 text-xs')}
          onClick={onClearAll}
          disabled={!getLockedPaths().length}
        >
          Clear all
        </button>
      </div>

      <Show
        when={getLockedPaths().length > 0}
        fallback={<p class="text-sm text-gray-400">No locked variables yet.</p>}
      >
        <ul class="max-h-64 space-y-2 overflow-auto pr-1">
          <For each={getLockedPaths()}>
            {(path) => (
              <li class="flex items-center gap-2 rounded border border-gray-700 bg-gray-900/70 px-2 py-1">
                <PrettyPath path={path} class="min-w-0 flex-1 font-mono text-xs break-all" />
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
