import { createVirtualizer } from '@tanstack/solid-virtual';
import { createSignal, For, Match, onCleanup, onMount, Switch } from 'solid-js';

import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { Path, SearchResultState } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { setNavigationPage, setViewState } from '../../store';
import { PrettyPath } from '../../ui/display/PrettyPath';
import { getPersistedValue, setPersistedValue } from '../../ui/util/persistedValue';
import { StateBooleanInput } from '../State/StateInputs/StateBooleanInput';
import { StateNumberInput } from '../State/StateInputs/StateNumberInput';
import { StateStringInput } from '../State/StateInputs/StateStringInput';

interface Props {
  results: SearchResultState[];
}

const stateResultsPathWidthKey = 'search-state-results-path-width';

export function StateResults(props: Props) {
  const [getWidth, setWidth] = createSignal(getPersistedValue(stateResultsPathWidthKey, 256));
  const onPathClick = (path: Path) => {
    setNavigationPage('state');
    setViewState('state', 'path', [...path]);
  };

  let scrollElRef: HTMLDivElement | undefined;
  const virtualizer = createVirtualizer({
    getScrollElement: () => scrollElRef ?? null,
    estimateSize: () => 38,
    get count() {
      return props.results.length;
    },
    overscan: 5,
  });

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

    // -44 to cancel out icon column and col-gap
    const width = newLeftWidth - 44;
    setWidth(width);
    setPersistedValue(stateResultsPathWidthKey, width);
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
    <div class="h-full relative overflow-hidden flex-1 py-1" ref={containerRef}>
      <div class="h-full overflow-auto" ref={scrollElRef}>
        <ul class="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(virtualItem) => {
              const result = () => props.results[virtualItem.index]!;
              const type = () => getSpecificType(result().value);

              return (
                <li
                  class="grid items-center px-2 gap-x-2"
                  style={{
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': `${virtualItem.size}px`,
                    'transform': `translateY(${virtualItem.start}px)`,
                    'grid-template-columns': `auto minmax(auto,${getWidth()}px) 8px 1fr`,
                  }}
                >
                  {/* col 1: icon */}
                  <span class="col-start-1">
                    <TypeIcon type={type()} />
                  </span>

                  {/* col 2: path */}
                  <span class="col-start-2">
                    <button
                      type="button"
                      class="py-2 font-mono cursor-pointer hover:underline text-left text-nowrap overflow-hidden text-ellipsis max-w-full"
                      onClick={() => onPathClick(result().path)}
                    >
                      <PrettyPath path={result().path} />
                    </button>
                  </span>
                  <div class="col-start-3" />

                  {/* col 3: input (aligned across rows) */}
                  <div class="col-start-4 justify-self-start w-full">
                    <Switch>
                      <Match when={type() === 'string'}>
                        <StateStringInput path={result().path} />
                      </Match>
                      <Match when={type() === 'number'}>
                        <StateNumberInput path={result().path} />
                      </Match>
                      <Match when={type() === 'boolean'}>
                        <StateBooleanInput path={result().path} />
                      </Match>
                    </Switch>
                  </div>
                </li>
              );
            }}
          </For>
        </ul>
      </div>
      <div
        class="absolute top-0 bottom-2 w-2 bg-slate-700 hover:bg-slate-500 rounded-full cursor-col-resize"
        style={{ left: `${44 + getWidth()}px` }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
