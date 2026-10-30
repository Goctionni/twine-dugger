import { createMemo, getOwner, runWithOwner, type Accessor } from 'solid-js';

import { pathKey } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

/**
 * One memo per container of the tree, made when it is first asked for. When something in one
 * container changes only the memo of that container works itself out again, and not those of all
 * the containers that are open.
 */
export function createContainerMemos<T>(
  compute: (containerPath: Path) => T,
  equals: (a: T, b: T) => boolean,
) {
  // The memos are made while the rows are worked out, which is itself a computation: they belong
  // to the tree, or they would be thrown away with every pass
  const owner = getOwner();
  const memos = new Map<string, Accessor<T>>();

  return (containerPath: Path) =>
    memos.getOrInsertComputed(pathKey(containerPath), () =>
      runWithOwner(owner, () => createMemo(() => compute(containerPath), { equals }))!,
    )();
}
