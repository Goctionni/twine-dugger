import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createSignal, onCleanup } from 'solid-js';

import { getPersistedValue, setPersistedValue } from './persistedValue';

interface Interface {
  leftContent: JSX.Element;
  rightContent: JSX.Element;
  initialLeftWidthPercent?: number;
  splitKey?: string;
  class?: string;
}

const DIVIDER_WIDTH = 8;

export function MovableSplit(props: Interface) {
  const splitKey = () => props.splitKey;
  const initialWidthPct = props.initialLeftWidthPercent || 50;
  const fallbackWidth = `${initialWidthPct}%`;
  const [leftWidth, setLeftWidth] = createSignal(
    splitKey() ? getPersistedValue(splitKey()!, fallbackWidth) : fallbackWidth,
  );
  const [isDragging, setIsDragging] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  let containerLeft = 0;
  let pendingX = 0;
  let frame = 0;

  // Moves come in faster than frames are drawn; only the latest position matters
  const handlePointerMove = (e: PointerEvent) => {
    pendingX = e.clientX;
    if (frame) return;

    frame = requestAnimationFrame(() => {
      frame = 0;
      const width = `${pendingX - containerLeft - DIVIDER_WIDTH / 2}px`;
      setLeftWidth(width);
      if (splitKey()) setPersistedValue(splitKey()!, width);
    });
  };

  // The listeners are on the document, not the divider: the drag has to end wherever the pointer is
  let listeners: AbortController | undefined;
  const removeListeners = () => {
    listeners?.abort();
    cancelAnimationFrame(frame);
    frame = 0;
  };

  function stopDragging() {
    removeListeners();
    setIsDragging(false);
  }

  const startDragging = (e: PointerEvent) => {
    e.preventDefault();
    containerLeft = containerRef?.getBoundingClientRect().left ?? 0;
    listeners = new AbortController();
    const { signal } = listeners;
    document.addEventListener('pointermove', handlePointerMove, { signal });
    document.addEventListener('pointerup', stopDragging, { signal });
    document.addEventListener('pointercancel', stopDragging, { signal });
    setIsDragging(true);
  };

  onCleanup(removeListeners);

  return (
    <div
      ref={containerRef}
      class={clsx(props.class || 'flex w-full grow overflow-hidden', isDragging() && 'select-none')}
    >
      <div
        class={clsx('shrink-0 bg-gray-900', isDragging() && 'pointer-events-none')}
        style={{ width: leftWidth() }}
      >
        {props.leftContent}
      </div>

      {/* Divider */}
      <div
        class="shrink-0 cursor-col-resize touch-none bg-gray-700 hover:bg-sky-600"
        style={{ width: `${DIVIDER_WIDTH}px` }}
        onPointerDown={startDragging}
      />

      {/* Right Panel */}
      <div class={clsx('min-w-0 flex-1 bg-gray-900', isDragging() && 'pointer-events-none')}>
        {props.rightContent}
      </div>
    </div>
  );
}
