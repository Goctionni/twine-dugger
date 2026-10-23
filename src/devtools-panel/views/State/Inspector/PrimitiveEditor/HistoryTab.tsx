import { For, Show, createSignal } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getLatestId, getLatestState } from '@/devtools-panel/store/game-state';
import { getPathValue } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { createEditStatus } from '../createEditStatus';
import { createStablePath } from '../createStablePath';
import { createValueHistory } from '../createValueHistory';
import { describeAge, formatAsJson } from '../logic/info';
import { describeDelta } from '../logic/value-history';

const FIRST_ENTRIES = 5;

interface Props {
  path: Path;
}

export function HistoryTab(props: Props) {
  const getHistory = createValueHistory(() => props.path);
  const { canChange } = createEditStatus(() => props.path);
  const getValue = () => getPathValue(getLatestState(), props.path);

  const getStablePath = createStablePath(() => props.path);
  const [getShowAll, setShowAll] = createSignal(() => {
    getStablePath(); // Reset getShowAll when the path changes (The component stays alive during path changes)
    return false;
  });

  const getShown = () =>
    getShowAll() ? getHistory().entries : getHistory().entries.slice(0, FIRST_ENTRIES);
  const getHiddenCount = () => getHistory().entries.length - getShown().length;

  // What it was before the oldest change that is kept. Only known when that change did not add it
  const getEarlier = () => {
    const { entries } = getHistory();
    return getHiddenCount() === 0 ? entries.at(-1)?.before : undefined;
  };

  const restore = (value: JSONSafeValue) => setState(props.path, value);

  return (
    <Show
      when={getHistory().entries.length > 0}
      fallback={<p class="text-sm text-gray-400">No changes seen since the panel opened.</p>}
    >
      <ol class="flex flex-col text-sm">
        <For each={getShown()} keyed={(entry) => entry.id}>
          {(entry, getIndex) => (
            <li class="flex items-center gap-3 border-b border-gray-800 py-1.5">
              <div class="min-w-0 flex-1">
                <div class="font-mono break-all">
                  <Show when={entry().value !== undefined} fallback={<i>deleted</i>}>
                    {formatAsJson(entry().value!, 60)}
                  </Show>
                  <Show when={describeDelta(entry())}>
                    {(delta) => <span class="ml-2 text-gray-400">{delta()}</span>}
                  </Show>
                </div>
                <div class="text-xs text-gray-400">
                  {describeAge(getLatestId(), entry().id)} ·{' '}
                  {new Date(entry().timestamp).toLocaleTimeString()}
                </div>
              </div>
              <Show
                when={getIndex() === 0 && entry().value === getValue()}
                fallback={
                  <Show when={entry().value !== undefined}>
                    <button
                      type="button"
                      class="cursor-pointer rounded px-2 py-0.5 text-sky-400 hover:bg-gray-800 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent"
                      disabled={!canChange()}
                      onClick={() => restore(entry().value!)}
                    >
                      Restore
                    </button>
                  </Show>
                }
              >
                <span class="px-2 text-xs text-gray-400">Current</span>
              </Show>
            </li>
          )}
        </For>
        <Show when={getEarlier() !== undefined}>
          <li class="flex items-center gap-3 border-b border-gray-800 py-1.5">
            <div class="min-w-0 flex-1">
              <div class="font-mono break-all">{formatAsJson(getEarlier()!, 60)}</div>
              <div class="text-xs text-gray-400">
                before the first change seen
                <Show when={getHistory().forgotten > 0}>
                  {' '}
                  · {getHistory().forgotten} older, forgotten
                </Show>
              </div>
            </div>
            <button
              type="button"
              class="cursor-pointer rounded px-2 py-0.5 text-sky-400 hover:bg-gray-800 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent"
              disabled={!canChange()}
              onClick={() => restore(getEarlier()!)}
            >
              Restore
            </button>
          </li>
        </Show>
      </ol>
      <Show when={getHiddenCount() > 0}>
        <button
          type="button"
          class="mt-2 cursor-pointer text-sm text-sky-400 hover:underline"
          onClick={() => setShowAll(true)}
        >
          Show older ({getHiddenCount()})
        </button>
      </Show>
    </Show>
  );
}
