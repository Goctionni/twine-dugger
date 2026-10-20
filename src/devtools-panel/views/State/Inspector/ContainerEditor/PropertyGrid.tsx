import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned } from '@/devtools-panel/store/store';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue, isContainer } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, Path } from '@/shared/shared-types';

import { getVisibleKeys } from '../../Navigators/Shared/visible-keys';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import { countUnsavedChildren, discardChildDrafts, saveChildDrafts } from '../draft-registry';
import { PropertyRow } from './PropertyRow';

type Key = string | number;

interface Props {
  path: Path;
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

  // What is selected belongs to this container
  const [getSelected, setSelected] = createSignal<ReadonlySet<Key>>(new Set());
  createEffect(
    () => pathKey(props.path),
    () => {
      setSelected(new Set<Key>());
    },
  );
  const toggle = (key: Key) =>
    setSelected((selected) => {
      const next = new Set(selected);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const getUnsavedCount = () => countUnsavedChildren(props.path);

  return (
    <section aria-label="Properties" class="@container flex flex-col gap-1">
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
        {/* Wide: the names share a column, as wide as the longest but not over 40%. Narrow: each row is two lines */}
        <ul class="-mx-2 grid grid-cols-1 @min-[22rem]:grid-cols-[fit-content(40%)_minmax(0,1fr)_auto]">
          <For each={getPrimitiveKeys()}>
            {(key) => (
              <PropertyRow
                path={[...props.path, key]}
                isSelected={getSelected().has(key)}
                onToggle={() => toggle(key)}
              />
            )}
          </For>
        </ul>
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
