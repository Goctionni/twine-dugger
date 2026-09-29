import clsx from 'clsx';
import { createMemo, For } from 'solid-js';

import {
  createGetSetting,
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

  return (
    <div class="group" style={{ 'font-size': `${getFontSize()}px` }}>
      <div
        class={clsx(
          'flex items-center gap-2',
          !props.first && 'mt-3 border-t border-gray-700/50 pt-3',
        )}
      >
        <button
          class="cursor-pointer font-bold text-gray-300"
          onClick={() => {
            setViewState('passage', 'selected', props.frame.passage);
            setNavigationPage('passages');
          }}
        >
          {props.frame.passage}
        </button>
        <RelativeTime date={date()} />
      </div>

      <div class="mt-1 space-y-0.5 text-gray-400">
        <For each={changes()}>{(change) => <DiffItem change={change} />}</For>
      </div>
    </div>
  );
}
