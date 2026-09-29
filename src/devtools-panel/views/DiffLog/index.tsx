import { createMemo, For } from 'solid-js';

import { clearDiffFrames, getDiffFrames } from '../../store/game-state';
import { clearFilteredPaths } from '../../store/store';
import { createContextMenuHandler } from '../../ui/util/ContextMenu';
import { sameItems } from '../../utils/same-items';
import { DiffFrame } from './DiffFrame';
import { hasVisibleEntries } from './frame-entries';

const MAX_FRAMES = 30;

export function DiffLog() {
  const onContextMenu = createContextMenuHandler([
    { label: 'Clear Diff Log', onClick: () => clearDiffFrames() },
    { label: 'Clear All Filters', onClick: () => clearFilteredPaths() },
  ]);

  // Frames are immutable and keep their identity, so a new frame adds one row and changing the
  // filters only touches the rows that appear or disappear.
  const frames = createMemo(() => getDiffFrames().filter(hasVisibleEntries).slice(0, MAX_FRAMES), {
    equals: sameItems,
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
