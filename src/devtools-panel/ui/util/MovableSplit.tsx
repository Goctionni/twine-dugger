import { createSignal, JSX, onCleanup, onMount } from 'solid-js';

import { getPersistedValue, setPersistedValue } from './persistedValue';

interface Interface {
  leftContent: JSX.Element;
  rightContent: JSX.Element;
  initialLeftWidthPercent?: number;
  splitKey?: string;
  class?: string;
}

export function MovableSplit(props: Interface) {
  const splitKey = () => props.splitKey;
  const initialWidthPct = props.initialLeftWidthPercent || 50;
  const fallbackWidth = `${initialWidthPct}%`;
  const [leftWidth, setLeftWidth] = createSignal(
    splitKey() ? getPersistedValue(splitKey()!, fallbackWidth) : fallbackWidth,
  );
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
    const width = `${newLeftWidth - 4}px`;
    setLeftWidth(width);
    if (splitKey()) setPersistedValue(splitKey()!, width);
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
      <div class="bg-gray-900 flex-grow" style={{ width: `calc(100% - 8px - ${leftWidth()}` }}>
        {props.rightContent}
      </div>
    </div>
  );
}
