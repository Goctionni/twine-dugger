import type { JSX } from '@solidjs/web/jsx-runtime';
import { Show } from 'solid-js';

import { createPersistedSignal } from '../persistedValue';
import { CollapsedBar, type Side } from './CollapsedBar';
import { createLiveOrientation, type SplitDirection } from './createLiveOrientation';
import { Divider } from './Divider';
import { Panel } from './Panel';

export type { SplitDirection, SplitOrientation } from './createLiveOrientation';

interface Props {
  firstContent: JSX.Element;
  secondContent: JSX.Element;
  firstLabel?: string;
  secondLabel?: string;
  direction: SplitDirection;
  onDirectionChange: (direction: SplitDirection) => void;
  initialFirstSizePercent?: number;
  splitKey?: string;
  class?: string;
}

/** Dragging a panel smaller than this collapses it */
const MIN_PANEL_PX = 80;
const EXPAND_MARGIN_PX = 20;
const DIVIDER_PX = 8;

export function MovableSplit(props: Props) {
  const getSplitKey = () => props.splitKey;
  const keyFor = (name: string) => (getSplitKey() ? `${getSplitKey()}:${name}` : undefined);

  const [getFirstSizePercent, setFirstSizePercent] = createPersistedSignal(
    keyFor('size'),
    props.initialFirstSizePercent || 50,
  );
  const [getCollapsed, setCollapsed] = createPersistedSignal<Side | null>(
    keyFor('collapsed'),
    null,
  );

  let containerRef: HTMLDivElement | undefined;
  const getOrientation = createLiveOrientation(
    () => props.direction,
    () => containerRef,
  );

  const getFreeSpace = () => {
    const rect = containerRef!.getBoundingClientRect();
    return (getOrientation() === 'vertical' ? rect.height : rect.width) - DIVIDER_PX;
  };

  const dragTo = (e: PointerEvent) => {
    const rect = containerRef!.getBoundingClientRect();
    const pointer = getOrientation() === 'vertical' ? e.clientY - rect.top : e.clientX - rect.left;
    const firstSize = pointer - DIVIDER_PX / 2;
    const free = getFreeSpace();

    if (firstSize < MIN_PANEL_PX) setCollapsed('first');
    else if (free - firstSize < MIN_PANEL_PX) setCollapsed('second');
    else {
      setFirstSizePercent((firstSize / free) * 100);
      setCollapsed(null);
    }
  };

  let suppressClick = false;
  const startDrag = (e: PointerEvent, fromBar: boolean) => {
    e.preventDefault();
    let moved = !fromBar;
    const orientation = getOrientation();
    document.body.style.cursor = orientation === 'vertical' ? 'row-resize' : 'col-resize';

    const controller = new AbortController();
    document.addEventListener(
      'pointermove',
      (event) => {
        const startPointer = orientation === 'vertical' ? e.clientY : e.clientX;
        const pointer = orientation === 'vertical' ? event.clientY : event.clientX;
        if (!moved && Math.abs(pointer - startPointer) < 4) return;
        moved = true;
        dragTo(event);
      },
      { signal: controller.signal },
    );
    const end = () => {
      controller.abort();
      document.body.style.cursor = '';
      if (fromBar && moved) {
        // The click that follows the release belongs to the drag
        suppressClick = true;
        setTimeout(() => (suppressClick = false));
      }
    };
    document.addEventListener('pointerup', end, { signal: controller.signal });
    document.addEventListener('pointercancel', end, { signal: controller.signal });
  };

  const expand = () => {
    const minPercent = ((MIN_PANEL_PX + EXPAND_MARGIN_PX) / getFreeSpace()) * 100;
    const percent = getFirstSizePercent();
    setFirstSizePercent(
      getCollapsed() === 'first'
        ? Math.max(percent, minPercent)
        : Math.min(percent, 100 - minPercent),
    );
    setCollapsed(null);
  };

  const changeDirection = (shift: boolean) => {
    if (shift) props.onDirectionChange('auto');
    else props.onDirectionChange(getOrientation() === 'vertical' ? 'horizontal' : 'vertical');
  };

  const getFirstFlex = () =>
    getCollapsed() === 'second'
      ? '1 1 0'
      : `0 0 calc((100% - ${DIVIDER_PX}px) * ${getFirstSizePercent() / 100})`;

  return (
    <div
      ref={containerRef}
      class={[
        props.class || 'flex w-full grow overflow-hidden',
        getOrientation() === 'vertical' && 'flex-col',
      ]}
    >
      <Panel collapsed={getCollapsed() === 'first'} flex={getFirstFlex()}>
        {props.firstContent}
      </Panel>

      <Show
        when={getCollapsed()}
        fallback={
          <Divider
            orientation={getOrientation()}
            onStartDrag={(e) => startDrag(e, false)}
            onChangeDirection={changeDirection}
          />
        }
      >
        {(side) => (
          <CollapsedBar
            orientation={getOrientation()}
            side={side()}
            label={side() === 'first' ? props.firstLabel : props.secondLabel}
            onPointerDown={(e) => startDrag(e, true)}
            onClick={() => {
              if (!suppressClick) expand();
            }}
          />
        )}
      </Show>

      <Panel collapsed={getCollapsed() === 'second'} flex="1 1 0">
        {props.secondContent}
      </Panel>
    </div>
  );
}
