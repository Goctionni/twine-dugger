import { Show, createMemo, createSignal } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue, isContainer } from '@/shared/json-safe';
import type { JSONSafeObject, Path } from '@/shared/shared-types';

import { createVirtualList } from '../../Navigators/Shared/create-virtual-list';
import { VirtualItems } from '../../Navigators/Shared/VirtualItems';
import { getVisibleKeys } from '../../Navigators/Shared/visible-keys';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import {
  countUnsavedChildren,
  discardChildDrafts,
  getUnsavedChildKeys,
  saveChildDrafts,
} from '../draft-registry';
import { BulkRow } from './BulkRow';
import type { Selection } from './createSelection';
import { PropertyRow } from './PropertyRow';
import { getNameColumn } from './row-layout';

type Key = string | number;

// 30px of editor and 2 x 4px of padding, at the size of the text of 16px
const ROW_HEIGHT = 38;

interface Props {
  path: Path;
  selection: Selection;
}

const textButtonClass = 'cursor-pointer text-sky-400 hover:underline';

/** The primitive properties of a container, in the order of the navigator, each with its editor */
export function PropertyGrid(props: Props) {
  const getContainer = createMemo(() => getPathValue(getLatestState(), props.path));

  const getKeys = createMemo(
    () =>
      getVisibleKeys(
        getContainer(),
        getSort(),
        getHiddenTypes(),
        (key) => getLastChangeId([...props.path, key]),
        (key) => isPinned([...props.path, key]),
      ),
    { equals: sameItems },
  );

  const isPrimitive = (key: Key) => !isContainer((getContainer() as JSONSafeObject)[key]);
  const getPrimitiveKeys = createMemo(() => getKeys().filter(isPrimitive), { equals: sameItems });
  const getContainerCount = () => getKeys().length - getPrimitiveKeys().length;

  // Only what is in the grid can be selected
  const getSelectedKeys = createMemo(
    () => getPrimitiveKeys().filter((key) => props.selection.getSelected().has(key)),
    { equals: sameItems },
  );

  const getUnsavedCount = () => countUnsavedChildren(props.path);

  // A row that has something typed in it, or the focus, stays in the DOM when it is scrolled out
  // of the window: it would lose the text, or the focus
  const [getFocusedKey, setFocusedKey] = createSignal<Key>();
  const list = createVirtualList({
    getKeys: getPrimitiveKeys,
    estimateSize: ROW_HEIGHT,
    getKeptKeys: () => {
      const focusedKey = getFocusedKey();
      const unsavedKeys = getUnsavedChildKeys(props.path);
      return focusedKey === undefined ? unsavedKeys : [...unsavedKeys, focusedKey];
    },
  });
  const trackFocus = (event: FocusEvent) => {
    const index = (event.target as Element).closest<HTMLElement>('[data-index]')?.dataset.index;
    setFocusedKey(index === undefined ? undefined : getPrimitiveKeys()[Number(index)]);
  };
  const untrackFocus = (event: FocusEvent) => {
    if (!list.getListElement()?.contains(event.relatedTarget as Node | null)) {
      setFocusedKey(undefined);
    }
  };

  return (
    <section
      aria-label="Properties"
      class="flex flex-col gap-1"
      style={{ '--name-column': getNameColumn(getPrimitiveKeys()) }}
    >
      {/* Always as tall as the line: it appears while typing, and nothing should move */}
      <div class="flex min-h-5 items-center gap-3 text-xs text-gray-400">
        <Show when={getUnsavedCount() > 0}>
          <span>
            {getUnsavedCount()} unsaved {getUnsavedCount() === 1 ? 'change' : 'changes'}
          </span>
          <button
            type="button"
            class={textButtonClass}
            onClick={() => void saveChildDrafts(props.path)}
          >
            Save all
          </button>
          <button
            type="button"
            class={textButtonClass}
            onClick={() => discardChildDrafts(props.path)}
          >
            Discard
          </button>
        </Show>
      </div>
      <Show
        when={getPrimitiveKeys().length > 0}
        fallback={<p class="text-sm text-gray-400">No values to edit here.</p>}
      >
        <div class="-mx-2">
          <ul>
            <BulkRow
              path={props.path}
              keys={getPrimitiveKeys()}
              selectedKeys={getSelectedKeys()}
              onSelect={props.selection.select}
            />
          </ul>
          <div onFocusIn={trackFocus} onFocusOut={untrackFocus}>
            <VirtualItems list={list} role="list">
              {(item) => (
                <PropertyRow
                  path={[...props.path, item.key]}
                  isSelected={props.selection.getSelected().has(item.key)}
                  onToggle={() => props.selection.toggle(item.key)}
                  position={getPrimitiveKeys().indexOf(item.key) + 1}
                  size={getPrimitiveKeys().length}
                />
              )}
            </VirtualItems>
          </div>
        </div>
      </Show>
      <Show when={getContainerCount() > 0}>
        <p class="text-xs text-gray-400">
          {getContainerCount()} container{' '}
          {getContainerCount() === 1 ? 'property is' : 'properties are'} not shown here.
        </p>
      </Show>
    </section>
  );
}
