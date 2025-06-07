import { For } from 'solid-js';
import { DiffFrame } from './DiffLog/DiffFrame';
import type { DiffFrame as IDiffFrame, Path } from '@/shared/shared-types';
import { FontSizeControls } from './Settings/utils/FontSizeControls';
import { getDiffLogFontSize, setDiffLogFontSize } from './Settings/State/State';

interface Props {
  frames: IDiffFrame[];
  setPath: (path: Path) => void;
}

export function DiffLog(props: Props) {
  const frames = () => props.frames.slice(0, 30);
  return (
    <div class="p-4 flex flex-col h-full">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-gray-200">Diff Log</h2>
        <FontSizeControls
          value={getDiffLogFontSize()}
          setValue={setDiffLogFontSize}
          min={10}
          max={20}
        />
      </div>
      <ul class="overflow-auto flex-1">
        <For each={frames()}>
          {(frame, index) => (
            <li>
              <DiffFrame frame={frame} setPath={props.setPath} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}