import { For } from 'solid-js';
import { Frame } from './DiffLog/types';
import { DiffFrame } from './DiffLog/DiffFrame';

interface Props {
  frames: Frame[];
}

export function DiffLog(props: Props) {
  return (
    <div class="overflow-auto p-4">
      <h2 class="text-lg font-semibold mb-2 text-gray-200">Diff Log</h2>
      <ul>
        <For each={props.frames}>
          {(frame, index) => (
            <li>
              <DiffFrame frame={frame} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
