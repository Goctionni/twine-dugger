import { createMemo, createSignal, For, JSX, onCleanup, onMount } from 'solid-js';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  class?: string;
  innerClass?: string;
  renderItem: (item: T, index: number) => JSX.Element;
}

interface WindowedItem<T> {
  item: T;
  index: number;
}

export function VirtualizedList<T>(props: VirtualizedListProps<T>) {
  const overscan = () => props.overscan ?? 8;
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(0);
  let containerRef: HTMLDivElement | undefined;

  const totalHeight = createMemo(() => props.items.length * props.itemHeight);
  const startIndex = createMemo(() => {
    const raw = Math.floor(scrollTop() / props.itemHeight) - overscan();
    return Math.max(0, raw);
  });
  const endIndex = createMemo(() => {
    const visible = Math.ceil(viewportHeight() / props.itemHeight);
    return Math.min(props.items.length, startIndex() + visible + overscan() * 2);
  });

  const visibleItems = createMemo<WindowedItem<T>[]>(() => {
    const start = startIndex();
    const end = endIndex();
    const out: WindowedItem<T>[] = [];
    for (let i = start; i < end; i++) {
      const item = props.items[i];
      if (item !== undefined) out.push({ item, index: i });
    }
    return out;
  });

  const onScroll = (e: Event) => {
    const currentTarget = e.currentTarget as HTMLDivElement;
    setScrollTop(currentTarget.scrollTop);
  };

  onMount(() => {
    if (!containerRef) return;
    setViewportHeight(containerRef.clientHeight);
    const observer = new ResizeObserver(() => {
      if (!containerRef) return;
      setViewportHeight(containerRef.clientHeight);
    });
    observer.observe(containerRef);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div
      ref={containerRef}
      class={props.class ?? 'h-full overflow-auto'}
      onScroll={onScroll}
      data-virtualized-list="true"
    >
      <div class={props.innerClass} style={{ height: `${totalHeight()}px`, position: 'relative' }}>
        <For each={visibleItems()}>
          {(entry) => (
            <div
              style={{
                position: 'absolute',
                top: `${entry.index * props.itemHeight}px`,
                left: '0',
                right: '0',
                height: `${props.itemHeight}px`,
              }}
            >
              {props.renderItem(entry.item, entry.index)}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
