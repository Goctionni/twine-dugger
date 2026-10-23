import { createEffect, createStore } from 'solid-js';

import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

/** The keys of the paths that hold the value at a path: all of its parents, not the state itself */
function getAncestorIds(path: Path) {
  return Array.from({ length: Math.max(0, path.length - 1) }, (_, index) =>
    pathKey(path.slice(0, index + 1)),
  );
}

/** Which containers of the tree are open, by the key of their path. It is kept in memory only */
export function createTreeExpansion(getSelectedPath: () => Path) {
  // A store keyed by path: opening one container only notifies the row of that container.
  // It starts with the ancestors of the selection open, so that the first rows already show it
  const [expanded, setExpanded] = createStore<Record<string, boolean>>(
    Object.fromEntries(getAncestorIds(getSelectedPath()).map((id) => [id, true])),
  );

  // Ideally this should not be handled in an effect, but because a change of path could be triggered
  // from anywhere, we accept the tiny code-smell and perf hit, and do this in an effect.
  // Do not copy this pattern lightly.
  createEffect(getSelectedPath, (path) => {
    setExpanded((draft) => {
      for (const id of getAncestorIds(path)) draft[id] = true;
    });
  });

  return {
    isExpanded: (id: string) => expanded[id] === true,
    toggle: (id: string) =>
      setExpanded((draft) => {
        if (draft[id]) delete draft[id];
        else draft[id] = true;
      }),
    expand: (id: string) =>
      setExpanded((draft) => {
        draft[id] = true;
      }),
    collapse: (id: string) =>
      setExpanded((draft) => {
        delete draft[id];
      }),
  };
}
