import type { ContainerType } from '@/shared/json-safe';
import {
  getContainerKeys,
  getJsonType,
  isContainerType,
  isNumberLike,
  isNumberMapValue,
} from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path, ValueType } from '@/shared/shared-types';

// The plain-text form of what PrettyPath shows
const isIdentifier = (name: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);

/** One key of the state and the value under it */
export interface StateEntry {
  path: Path;
  /** The path as it is written, e.g. `schedule.get("monday")` */
  pathText: string;
  /** Where the last key starts in `pathText` */
  keyOffset: number;
  /** The last key of the path, as the state has it */
  key: string | number;
  /** Whether the key is a name: not for an array index or the position in a set */
  isName: boolean;
  type: ValueType;
  /** The value of a string, number or boolean; the others have none */
  primitive: string | number | boolean | undefined;
}

interface Frame {
  value: JSONSafeValue;
  path: Path;
  pathText: string;
}

/**
 * Calls `visit` for every key in `root`, in the order of the state. Functions and dates are written
 * as objects, but they are not looked into. Iterative: a deep state can't overflow the stack.
 */
export function walkState(root: JSONSafeObject, visit: (entry: StateEntry) => void) {
  const stack: Frame[] = [{ value: root, path: [], pathText: '' }];
  while (stack.length) {
    const { value, path, pathText } = stack.pop()!;
    if (!value || typeof value !== 'object') continue;

    const container = getJsonType(value);
    if (!isContainerType(container)) continue;
    const numberMap = isNumberMapValue(value);
    const isRoot = path.length === 0;
    const isName = container === 'object' || container === 'map';

    const containers: Frame[] = [];
    for (const key of getContainerKeys(value, container)) {
      const child = (value as Record<string | number, JSONSafeValue>)[key]!;
      const type = getJsonType(child);
      const segment = pathSegment(container, key, { isRoot, numberMap });
      const childPath = [...path, key];
      const childPathText = pathText + segment.text;

      visit({
        path: childPath,
        pathText: childPathText,
        keyOffset: pathText.length + segment.keyOffset,
        key,
        isName,
        type,
        primitive:
          type === 'string' || type === 'number' || type === 'boolean'
            ? (child as string | number | boolean)
            : undefined,
      });

      if (child && typeof child === 'object') {
        containers.push({ value: child, path: childPath, pathText: childPathText });
      }
    }

    // Reversed, so that what is first in the state is found first
    stack.push(...containers.reverse());
  }
}

interface PathSegment {
  text: string;
  /** Where the key itself starts in `text` (after the dot, bracket or quote) */
  keyOffset: number;
}

function pathSegment(
  parentType: ContainerType,
  key: string | number,
  { isRoot, numberMap }: { isRoot: boolean; numberMap: boolean },
): PathSegment {
  if (parentType === 'object') {
    if (isRoot) return { text: String(key), keyOffset: 0 };
    if (typeof key === 'string' && !isIdentifier(key)) return { text: `["${key}"]`, keyOffset: 2 };
    return { text: `.${key}`, keyOffset: 1 };
  }
  if (parentType === 'array') return { text: `[${key}]`, keyOffset: 1 };
  if (parentType === 'set') return { text: `[${(key as number) - 1}]`, keyOffset: 1 };

  const isNumber = typeof key === 'number' || (numberMap && isNumberLike(key));
  return isNumber
    ? { text: `.get(${key})`, keyOffset: 5 }
    : { text: `.get("${key}")`, keyOffset: 6 };
}
