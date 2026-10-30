import type { JSX } from '@solidjs/web';
import { For } from 'solid-js';

import type { createVirtualList, VirtualListItem } from './create-virtual-list';

interface Props {
  list: ReturnType<typeof createVirtualList>;
  /** The role of the list, when the items are what it says (the element of an item has none) */
  role?: JSX.HTMLAttributes<HTMLDivElement>['role'];
  /** Classes of the element of an item, for what is laid out inside it */
  itemClass?: string;
  /** Style of the element of an item, for what is laid out inside it */
  getItemStyle?: (item: VirtualListItem) => JSX.CSSProperties;
  children: (item: VirtualListItem) => JSX.Element;
}

/**
 * The items of a `createVirtualList` in the window: a list as tall as all of them, and each item
 * absolutely positioned in it.
 */
export function VirtualItems(props: Props) {
  return (
    <div
      ref={props.list.listRef}
      role={props.role}
      class="relative"
      style={{ height: `${props.list.getTotalSize()}px` }}
    >
      <For each={props.list.getItems()}>
        {(item) => (
          <div
            role="none"
            data-index={item.index}
            ref={(element) => props.list.measureItem(element, item)}
            class={['absolute top-0 left-0 w-full', props.itemClass]}
            style={{
              transform: `translateY(${props.list.getOffset(item)}px)`,
              ...props.getItemStyle?.(item),
            }}
          >
            {props.children(item)}
          </div>
        )}
      </For>
    </div>
  );
}
