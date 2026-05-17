import { createMemo, For } from 'solid-js';

import { clearDiffFrames, clearFilteredPaths, getDiffFrames, isPathFiltered } from '../../store';
import { createContextMenuHandler } from '../../ui/util/ContextMenu';
import { DiffFrame } from './DiffFrame';

export function DiffLog() {
  const onContextMenu = createContextMenuHandler([
    { label: 'Clear Diff Log', onClick: () => clearDiffFrames() },
    { label: 'Clear All Filters', onClick: () => clearFilteredPaths() },
  ]);

  const frames = createMemo(() => {
    return getDiffFrames()
      .map((frame) => ({
        ...frame,
        changes: frame.changes.filter((frameChanges) => !isPathFiltered(frameChanges.path)),
      }))
      .filter((frame) => frame.changes.length > 0)
      .slice(0, 30);
  });

  return (
    <div onContextMenu={onContextMenu} class="p-4 flex flex-col h-full">
      <h2 class="text-lg font-semibold mb-2 text-gray-200">Diff Log</h2>
      <ul class="overflow-auto flex-1">
        <For each={frames()}>
          {(frame, index) => (
            <li>
              <DiffFrame frame={frame} first={index() === 0} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
