import clsx from 'clsx';
import { For } from 'solid-js';

import {
  createGetSetting,
  getPassageData,
  setNavigationPage,
  setViewState,
} from '@/devtools-panel/store';
import type { DiffFrame as TDiffFrame, ParsedPassageData } from '@/shared/shared-types';

import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';

interface Props {
  first?: boolean;
  frame: TDiffFrame;
}

export function DiffFrame(props: Props) {
  const showSeparator = () => !props.first;
  const getFontSize = createGetSetting('diffLog.fontSize');

  return (
    <div class="group" style={{ 'font-size': `${getFontSize()}px` }}>
      <div
        class={clsx(
          'flex items-center gap-2',
          showSeparator() && 'mt-3 border-t border-gray-700/50 pt-3',
        )}
      >
        <button
          class="cursor-pointer font-bold text-gray-300"
          onClick={() => {
            const passage = getPassageData().find((p) => p.name === props.frame.passage);
            if (passage) setSelectedPassage(passage);
            setNavigationPage('passages');
          }}
        >
          {props.frame.passage}
        </button>
        <RelativeTime date={props.frame.timestamp} />
      </div>

      {/* lines */}
      <div class="mt-1 space-y-0.5 text-gray-400">
        <For each={props.frame.changes}>{(diff) => <DiffItem diff={diff} />}</For>
      </div>
    </div>
  );
}

function setSelectedPassage(passage: ParsedPassageData) {
  setViewState('passage', 'selected', { ...passage });
}
