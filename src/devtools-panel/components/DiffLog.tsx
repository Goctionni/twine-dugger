import { For } from 'solid-js';

import type { DiffFrame as IDiffFrame, PassageData, Path } from '@/shared/shared-types';

import { createContextMenuHandler } from './ContextMenu';
import { DiffFrame } from './DiffLog/DiffFrame';

interface Props {
  frames: IDiffFrame[];
  setPath: (path: Path) => void;
  onClear: () => void;
  filteredPaths: string[];
  onAddFilter: (path: string) => void;
  onClearFilters: () => void;
  passageData?: PassageData[];
}

export function DiffLog(props: Props) {
  const onContextMenu = createContextMenuHandler([
    { label: 'Clear Diff Log', onClick: () => props.onClear() },
    { label: 'Clear All Filters', onClick: () => props.onClearFilters() },
  ]);

  const frames = () => {
    return props.frames
      .map((frame) => ({
        ...frame,
        changes: frame.changes.filter((c) => !props.filteredPaths.includes(c.path.join('.'))),
      }))
      .filter((frame) => frame.changes.length > 0)
      .slice(0, 30);
  };

  return (
    <div onContextMenu={onContextMenu} class="p-4 flex flex-col h-full">
      <h2 class="text-lg font-semibold mb-2 text-gray-200">Diff Log</h2>
      <ul class="overflow-auto flex-1">
        <For each={frames()}>
          {(frame, index) => (
            <li>
              <DiffFrame
                frame={frame}
                setPath={props.setPath}
                first={index() === 0}
                onAddFilter={props.onAddFilter}
                passageData={props.passageData}
              />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
