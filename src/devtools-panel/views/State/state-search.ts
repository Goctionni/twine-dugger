import { createMemo, createSignal } from 'solid-js';

import { getJsonType, isContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue } from '@/shared/shared-types';

import { createQueryMatcher } from '../GlobalSearch/logic/query-matcher';
import type { QueryMatcher } from '../GlobalSearch/types';

// Module level: the text stays when the State view is left and visited again
export const [getSearchText, setSearchText] = createSignal('');

/** Nothing when there is no text to look for */
export const getSearchMatcher = createMemo<QueryMatcher | undefined>(() => {
  const searchText = getSearchText().trim();
  if (!searchText) return undefined;
  const result = createQueryMatcher(searchText, {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  return result.ok ? result.queryMatcher : undefined;
});

/**
 * Whether the search matches the key of a value (only a name: an object or a map; not the index
 * of an item of an array or a set) or the value itself (a string, a number or a boolean, as the
 * text it is written as).
 */
export function matchesSearch(
  queryMatcher: QueryMatcher,
  container: JSONSafeValue,
  key: string | number,
): boolean {
  const containerType = getJsonType(container);
  if (!isContainerType(containerType)) return false;
  if ((containerType === 'object' || containerType === 'map') && queryMatcher.test(String(key))) {
    return true;
  }
  const value = (container as JSONSafeObject)[key];
  const type = getJsonType(value);
  return (
    (type === 'string' || type === 'number' || type === 'boolean') &&
    queryMatcher.test(String(value as string | number | boolean))
  );
}
