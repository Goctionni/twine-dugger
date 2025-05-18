import { For } from 'solid-js';
import { Frame } from './types';
import { DiffItem } from './Diff';
import { RelativeTime } from './RelativeTime';

interface Props {
  frame: Frame;
}

export function DiffFrame(props: Props) {
  return (
    <div class="mb-1 text-gray-400">
      <div class="flex gap-2 items-center">
        <span class="text-gray-300 font-bold">{props.frame.passage}</span>
        <RelativeTime date={props.frame.timestamp} />
      </div>
      <For each={props.frame.changes}>{(diff) => <DiffItem diff={diff} />}</For>
    </div>
  );
}
