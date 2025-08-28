import clsx from 'clsx';
import { For } from 'solid-js';

import { createGetSetting } from '@/devtools-panel/store/store';
import type { DiffFrame as TDiffFrame, PassageData } from '@/shared/shared-types';

import { navItems, setNavItem } from '../Layout/nav-items';
import { parsePassage, setSelectedPassage } from '../Views/passageDataStore';
import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';

interface Props {
  first?: boolean;
  frame: TDiffFrame;
  passageData?: PassageData[];
}

export function DiffFrame(props: Props) {
  const showSeparator = () => !props.first;
  const getFontSize = createGetSetting('diffLog.fontSize');

  return (
    <div class="group" style={{ 'font-size': `${getFontSize()}px` }}>
      <div
        class={clsx(
          'flex items-center gap-2',
          showSeparator() && 'mt-3 pt-3 border-t border-gray-700/50',
        )}
      >
        <button
          class="cursor-pointer font-bold text-gray-300"
          onClick={() => {
            setNavItem(navItems[2]);
            const passage = props.passageData?.find((p) => p.name === props.frame.passage);
            if (passage) setSelectedPassage(parsePassage(passage));
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
