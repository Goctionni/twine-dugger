import { createSignal } from 'solid-js';

interface GameFrameProps {
  url: string;
  width: number;
  height: number;
}

const zoomLevels = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];
const resetZoomIndex = zoomLevels.indexOf(1);

export function GameFrame(props: GameFrameProps) {
  const [getLeft, setLeft] = createSignal(() => Math.max(0, innerWidth - props.width - 16));
  const [getTop, setTop] = createSignal(() => Math.max(0, innerHeight - props.height - 16));
  const [getZoomIndex, setZoomIndex] = createSignal(resetZoomIndex);
  const getZoom = () => zoomLevels[getZoomIndex()]!;
  let dragStart: { x: number; y: number; left: number; top: number } | undefined;

  function onHeaderPointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
    if ((event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart = { x: event.clientX, y: event.clientY, left: getLeft(), top: getTop() };
  }

  function onHeaderPointerMove(event: PointerEvent) {
    if (!dragStart) return;
    setLeft(dragStart.left + event.clientX - dragStart.x);
    setTop(dragStart.top + event.clientY - dragStart.y);
  }

  return (
    <div
      class="fixed z-50 flex resize flex-col overflow-hidden border-2 border-gray-600 bg-white"
      style={{
        left: `${getLeft()}px`,
        top: `${getTop()}px`,
        width: `${props.width}px`,
        height: `${props.height}px`,
      }}
    >
      <div
        class="flex h-5 shrink-0 cursor-move items-center bg-gray-700 px-2 text-[11px] text-gray-200 select-none"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={() => (dragStart = undefined)}
      >
        <span class="flex-1 truncate" title="Drag to move, corner to resize">
          game
        </span>
        <button
          type="button"
          class="px-1.5 hover:bg-gray-600 disabled:opacity-40"
          title="Zoom out"
          disabled={getZoomIndex() === 0}
          onClick={() => setZoomIndex(getZoomIndex() - 1)}
        >
          −
        </button>
        <button
          type="button"
          class="w-9 hover:bg-gray-600"
          title="Reset zoom"
          onClick={() => setZoomIndex(resetZoomIndex)}
        >
          {Math.round(getZoom() * 100)}%
        </button>
        <button
          type="button"
          class="px-1.5 hover:bg-gray-600 disabled:opacity-40"
          title="Zoom in"
          disabled={getZoomIndex() === zoomLevels.length - 1}
          onClick={() => setZoomIndex(getZoomIndex() + 1)}
        >
          +
        </button>
      </div>
      <div class="relative min-h-0 flex-1 overflow-hidden">
        <iframe
          id="game"
          src={props.url}
          class="absolute top-0 left-0 border-0"
          style={{
            'width': `${100 / getZoom()}%`,
            'height': `${100 / getZoom()}%`,
            'scale': String(getZoom()),
            'transform-origin': 'top left',
          }}
        />
      </div>
    </div>
  );
}
