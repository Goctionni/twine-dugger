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
    <div onContextMenu={onContextMenu} class="flex h-full flex-col p-4">
      <h2 class="mb-2 text-lg font-semibold text-gray-200">Diff Log</h2>
      <ul class="flex-1 overflow-auto">
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
