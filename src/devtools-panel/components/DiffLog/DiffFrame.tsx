import { For, createMemo } from 'solid-js';
import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';
import { getSetting } from '../Settings/PersistSettings';
import type { DiffFrame } from '@/shared/shared-types';

interface Props {
  frame: DiffFrame;
}

export function DiffFrame(props: Props) {
  const showSeparation = createMemo(() => getSetting('diffLogSeparation'));
  const fontSize = createMemo(() => getSetting('fontSize'));

  return (
    <>
      {showSeparation() && <div class="h-px bg-gray-800 my-2" />}
      <div
        class="mb-1 text-gray-400"
        style={{ 'font-size': `${fontSize()}px` }}
      >
        <div class="flex gap-2 items-center">
          <span class={showSeparation() ? 'text-purple-400 font-bold' : 'text-gray-300 font-bold'}>
            {props.frame.passage}
          </span>
          <RelativeTime date={props.frame.timestamp} />
        </div>
        <For each={props.frame.changes}>{(diff) => <DiffItem diff={diff} />}</For>
      </div>
    </>
  );
}
