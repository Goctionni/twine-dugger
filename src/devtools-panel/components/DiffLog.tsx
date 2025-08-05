import { For, onMount, onCleanup } from 'solid-js';
import { DiffFrame } from './DiffLog/DiffFrame';
import type { DiffFrame as IDiffFrame, Path } from '@/shared/shared-types';
import { useContextMenu } from '@/devtools-panel/components/ContextMenuProvider/ContextMenu';

interface Props {
  frames: IDiffFrame[];
  setPath: (path: Path) => void;
}

export function DiffLog(props: Props) {
  const { registerContextHandler } = useContextMenu();
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    const unregister = registerContextHandler((e) => {
      if (!containerRef?.contains(e.target as Node)) return null;
      return [
        { label: 'DiffLog Option', onClick: () => console.log('DiffLog clicked') },
      ];
    });

    onCleanup(() => unregister());
  });

  const frames = () => props.frames.slice(0, 30);
  return (
    <div ref={containerRef} class="p-4 flex flex-col h-full">
      <h2 class="text-lg font-semibold mb-2 text-gray-200">Diff Log</h2>
      <ul class="overflow-auto flex-1">
        <For each={frames()}>
          {(frame, index) => (
            <li>
              <DiffFrame frame={frame} setPath={props.setPath} first={index() === 0} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
