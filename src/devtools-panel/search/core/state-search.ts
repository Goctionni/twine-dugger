import { getJsonType, isNumberMapValue, SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { ContainerType } from '@/shared/json-safe';
import { pathKey } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path, ValueType } from '@/shared/shared-types';

import { pathSegment } from './path-text';
import type { CompiledQuery } from './query';
import type { Range, SearchScope, StateHit } from './types';

export interface StateSearchResult {
  /** In the order the values are in the state */
  hits: StateHit[];
  /** How many hits there are of each type */
  typeCounts: Partial<Record<ValueType, number>>;
}

interface Frame {
  value: JSONSafeValue;
  path: Path;
  pathText: string;
}

const NO_RANGES: Range[] = [];
const shift = (ranges: Range[], by: number): Range[] =>
  by === 0 ? ranges : ranges.map(([start, end]) => [start + by, end + by] as const);

/**
 * Looks at every key and primitive value in `root`. A key only counts for objects and maps (an
 * array index or the position in a set isn't a name), and a value only for strings, numbers and
 * booleans. Numbers are matched as the text they are written as.
 */
export function searchState(
  root: JSONSafeObject,
  query: CompiledQuery,
  scope: SearchScope,
): StateSearchResult {
  const hits: StateHit[] = [];
  const typeCounts: StateSearchResult['typeCounts'] = {};
  if (!scope.statePath && !scope.stateValue) return { hits, typeCounts };

  const stack: Frame[] = [{ value: root, path: [], pathText: '' }];
  while (stack.length) {
    const { value, path, pathText } = stack.pop()!;
    if (!value || typeof value !== 'object') continue;

    const parentType = getJsonType(value);
    if (
      parentType !== 'object' &&
      parentType !== 'array' &&
      parentType !== 'map' &&
      parentType !== 'set'
    ) {
      continue;
    }
    const container: ContainerType = parentType;
    const numberMap = isNumberMapValue(value);
    const isRoot = path.length === 0;
    const matchesKeys = container === 'object' || container === 'map';

    const containers: Frame[] = [];
    const visit = (key: string | number, child: JSONSafeValue) => {
      const type = getJsonType(child);
      const primitive =
        type === 'string' || type === 'number' || type === 'boolean'
          ? (child as string | number | boolean)
          : undefined;
      const segment = pathSegment(container, key, { isRoot, numberMap });

      let pathMatch = NO_RANGES;
      if (scope.statePath && matchesKeys) {
        pathMatch = shift(query.ranges(String(key)), pathText.length + segment.keyOffset);
      }
      let valueMatch = NO_RANGES;
      if (scope.stateValue && primitive !== undefined) valueMatch = query.ranges(String(primitive));

      const childPath = [...path, key];
      if (pathMatch.length || valueMatch.length) {
        hits.push({
          key: pathKey(childPath),
          path: childPath,
          pathText: pathText + segment.text,
          type,
          value: primitive,
          pathMatch,
          valueMatch,
        });
        typeCounts[type] = (typeCounts[type] ?? 0) + 1;
      }
      if (child && typeof child === 'object') {
        containers.push({ value: child, path: childPath, pathText: pathText + segment.text });
      }
    };

    if (Array.isArray(value)) {
      for (let i = value[0] === SET_MARKER ? 1 : 0; i < value.length; i++) visit(i, value[i]!);
    } else {
      for (const key of Object.keys(value)) {
        if (key !== TYPE_KEY) visit(key, (value as JSONSafeObject)[key]!);
      }
    }

    // Reversed, so that what is first in the state is found first
    for (let i = containers.length - 1; i >= 0; i--) stack.push(containers[i]!);
  }

  return { hits, typeCounts };
}
