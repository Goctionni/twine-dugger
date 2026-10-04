import type { ContainerType } from '@/shared/json-safe';
import { isNumberLike } from '@/shared/json-safe';

// The plain-text form of what PrettyPath shows
const isIdentifier = (name: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);

export interface PathSegment {
  text: string;
  /** Where the key itself starts in `text` (after the dot, bracket or quote) */
  keyOffset: number;
}

export function pathSegment(
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
