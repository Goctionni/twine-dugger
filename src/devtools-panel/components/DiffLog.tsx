import { For } from 'solid-js';
import { DiffFrame } from './DiffLog/DiffFrame';
import type { DiffFrame as IDiffFrame, Path } from '@/shared/shared-types';
import { useContextMenu } from './ContextMenu/useContextMenu';

interface Props {
  frames: IDiffFrame[];
  setPath: (path: Path) => void;
  onClear: () => void;
  filteredPaths: string[];
  onAddFilter: (path: string) => void;
  onClearFilters: () => void;
}

export function DiffLog(props: Props) {
  const containerRef = useContextMenu([
    { label: 'Clear Diff Log', onClick: props.onClear },
    { label: 'Clear All Filters', onClick: props.onClearFilters }
  ]);

  const frames = () => {
    return props.frames
      .map(frame => ({
        ...frame,
        changes: frame.changes.filter(
          c => !props.filteredPaths.includes(c.path.join('.'))
        )
      }))
      .filter(frame => frame.changes.length > 0)
      .slice(0, 30);
  };

  return (
    <div ref={containerRef} class="p-4 flex flex-col h-full">
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
              />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
