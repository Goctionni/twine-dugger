import clsx from 'clsx';
import { createMemo, For, Show } from 'solid-js';

import { isFrameTainted } from '@/devtools-panel/store/game-state';
import { createGetSetting, setNavigationPage, setViewState } from '@/devtools-panel/store/store';
import type { StateDiff } from '@/devtools-panel/store/store-types';

import { BlockedWriteItem, DiffItem, ReloadedItem } from './Diff';
import { getVisibleEntries } from './frame-entries';
import { RelativeTime } from './RelativeTime';

interface Props {
  first?: boolean;
  frame: StateDiff;
}

const getFontSize = createGetSetting('diffLog.fontSize');

export function DiffFrame(props: Props) {
  // The changes are worked out from the delta when they're first shown, and after that only the
  // filters can change what is shown of a frame
  const entries = createMemo(() => getVisibleEntries(props.frame));
  const date = () => new Date(props.frame.timestamp);

  // Frames scrolled out of view are skipped by layout and paint, which is what keeps resizing the
  // panel cheap with a long log. The size they get meanwhile is a guess, until they have been seen.
  const estimatedHeight = () =>
    (entries().changes.length + entries().blocked.length) * getFontSize() * 1.65 + 40;

  return (
    <div
      class={clsx('group', isFrameTainted(props.frame) && 'opacity-50')}
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
      </div>

      <div class="mt-1 space-y-0.5 text-gray-400">
        <For each={entries().changes}>{(change) => <DiffItem change={change} />}</For>
        <For each={entries().blocked}>{(write) => <BlockedWriteItem write={write} />}</For>
        <Show when={props.frame.reloaded}>
          <ReloadedItem />
        </Show>
      </div>
    </div>
  );
}
