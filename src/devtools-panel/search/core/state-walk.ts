import {
  getContainerKeys,
  getJsonType,
  isContainerType,
  isNumberMapValue,
} from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path, ValueType } from '@/shared/shared-types';

import { pathSegment } from './path-text';

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
