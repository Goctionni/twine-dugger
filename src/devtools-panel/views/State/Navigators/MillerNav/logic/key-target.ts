import type { Path } from '@/shared/shared-types';

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * Where an arrow key takes the selection in the Miller columns, or nothing when it stays:
 * up and down go to the next and the previous key in the same column, left goes to the container,
 * right goes into the selected container (to the key of the trail when it goes that way, else the
 * first one). With nothing selected, down goes to the first key of the root.
 * `getKeysAt` has the keys of a column in the order that it shows them.
 */
export function getKeyTarget(
  key: ArrowKey,
  path: Path,
  trail: Path,
  getKeysAt: (containerPath: Path) => Array<string | number>,
): Path | undefined {
  if (key === 'ArrowLeft') return path.length ? path.slice(0, -1) : undefined;

  if (key === 'ArrowRight' || (key === 'ArrowDown' && !path.length)) {
    const children = getKeysAt(path);
    if (!children.length) return undefined;
    const onTrail = path.every((step, index) => trail[index] === step)
      ? trail[path.length]
      : undefined;
    return [...path, onTrail !== undefined && children.includes(onTrail) ? onTrail : children[0]!];
  }

  if (!path.length) return undefined;
  const container = path.slice(0, -1);
  const siblings = getKeysAt(container);
  const next = siblings[siblings.indexOf(path.at(-1)!) + (key === 'ArrowUp' ? -1 : 1)];
  return next === undefined ? undefined : [...container, next];
}
