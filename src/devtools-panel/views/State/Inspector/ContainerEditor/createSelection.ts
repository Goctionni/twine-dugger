import { createEffect, createSignal } from 'solid-js';

import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

type Key = string | number;

/** The properties that are selected in the grid of a container. Another container starts over */
export function createSelection(getPath: () => Path) {
  const [getSelected, setSelected] = createSignal<ReadonlySet<Key>>(new Set());
  createEffect(
    () => pathKey(getPath()),
    () => {
      setSelected(new Set<Key>());
    },
  );

  return {
    getSelected,
    select: (keys: Iterable<Key>) => setSelected(new Set(keys)),
    toggle: (key: Key) =>
      setSelected((selected) => {
        const next = new Set(selected);
        if (!next.delete(key)) next.add(key);
        return next;
      }),
  };
}

export type Selection = ReturnType<typeof createSelection>;
