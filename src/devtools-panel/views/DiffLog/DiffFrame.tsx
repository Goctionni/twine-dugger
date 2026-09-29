import clsx from 'clsx';
import { createMemo, For, Show } from 'solid-js';

import {
  createGetSetting,
  isFrameTainted,
  isPathFiltered,
  setNavigationPage,
  setViewState,
} from '@/devtools-panel/store/store';
import type { StateDiff } from '@/devtools-panel/store/store-types';

import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';

interface Props {
  first?: boolean;
  frame: StateDiff;
}

const getFontSize = createGetSetting('diffLog.fontSize');

export function DiffFrame(props: Props) {
  // A frame never changes, so only the filters can change what is shown of it
  const changes = createMemo(() =>
    props.frame.changes.filter((change) => !isPathFiltered(change.path)),
  );
  const date = () => new Date(props.frame.timestamp);

  // Frames scrolled out of view are skipped by layout and paint, which is what keeps resizing the
  // panel cheap with a long log. The size they get meanwhile is a guess, until they have been seen.
  const estimatedHeight = () => changes().length * getFontSize() * 1.65 + 40;

  return (
    <div
      class={clsx('group', isFrameTainted(props.frame) && 'opacity-75')}
      style={{
        'font-size': `${getFontSize()}px`,
        'content-visibility': 'auto',
        'contain-intrinsic-size': `auto ${Math.round(estimatedHeight())}px`,
      }}
    >
      <div
        class={clsx(
          'flex items-center gap-2',
          !props.first && 'mt-3 border-t border-gray-700/50 pt-3',
        )}
      >
        <Show when={props.frame.passage}>
          <button
            class="cursor-pointer font-bold text-gray-300"
            onClick={() => {
              setViewState('passage', 'selected', props.frame.passage);
              setNavigationPage('passages');
            }}
          >
            {props.frame.passage}
          </button>
        </Show>
        <RelativeTime date={date()} />
        <Show when={props.frame.repeats}>
          <span class="text-gray-400">×{props.frame.repeats}</span>
        </Show>
      </div>

      <div class="mt-1 space-y-0.5 text-gray-400">
        <For each={changes()}>{(change) => <DiffItem change={change} />}</For>
      </div>
    </div>
  );
}
