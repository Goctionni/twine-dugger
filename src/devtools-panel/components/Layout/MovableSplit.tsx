import { createSignal, JSX, onCleanup, onMount } from 'solid-js';

interface Interface {
  leftContent: JSX.Element;
  rightContent: JSX.Element;
  initialLeftWidthPercent?: number;
  class?: string;
}

export function MovableSplit(props: Interface) {
  const initialWidthPct = props.initialLeftWidthPercent || 50;
  const [leftWidth, setLeftWidth] = createSignal(`${initialWidthPct}%`); // Percentage
  const [isDragging, setIsDragging] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || !containerRef) return;
    const containerRect = containerRef.getBoundingClientRect();
    let newLeftWidth = e.clientX - containerRect.left;

    // Constrain width (e.g., min 10%, max 90%)
    setLeftWidth(`${newLeftWidth - 4}px`);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  return (
    <div ref={containerRef} class={props.class || 'flex flex-grow w-full overflow-hidden'}>
      {/* Left Panel */}
      <div
        class="bg-gray-900" // Slightly different bg for panels
        style={{ width: leftWidth() }}
      >
        {props.leftContent}
      </div>

      {/* Divider */}
      <div
        class="w-2 bg-gray-700 hover:bg-sky-600 cursor-col-resize flex-shrink-0"
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel */}
      <div class="bg-gray-900 flex-grow">{props.rightContent}</div>
    </div>
  );
}
