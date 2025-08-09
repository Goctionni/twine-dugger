import { For } from 'solid-js';
import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';
import type { DiffFrame, Path } from '@/shared/shared-types';
import clsx from 'clsx';
import { getDiffLogFontSize, getDiffLogHeadingStyle } from '@/devtools-panel/stores/settingsStore';

interface Props {
  first?: boolean;
  frame: DiffFrame;
  setPath: (path: Path) => void;
  onAddFilter: (path: string) => void;
}

export function DiffFrame(props: Props) {
  const showSeparator = () => !props.first && getDiffLogHeadingStyle() === 'distinct';
  return (
    <div class="mb-1 text-gray-400 group" style={{ 'font-size': `${getDiffLogFontSize()}px` }}>
      <div class={clsx('flex gap-2 items-center', { ['mt-2 border-t pt-2']: showSeparator() })}>
        <span
          class={clsx(
            'font-bold',
            getDiffLogHeadingStyle() === 'distinct' ? 'text-purple-400' : 'text-gray-300',
          )}
        >
          {props.frame.passage}
        </span>
        <RelativeTime date={props.frame.timestamp} />
      </div>
      <For each={props.frame.changes}>
        {(diff) => <DiffItem diff={diff} setPath={props.setPath} onAddFilter={props.onAddFilter} />}
      </For>
    </div>
  );
}
