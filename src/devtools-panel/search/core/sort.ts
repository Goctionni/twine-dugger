import type { PassageHit, PassageSort, StateHit, StateSort } from './types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const TYPE_ORDER: Record<string, number> = {
  object: 0,
  array: 1,
  map: 2,
  set: 3,
  string: 4,
  number: 5,
  boolean: 6,
};
const typeRank = (type: string) => TYPE_ORDER[type] ?? 7;

/**
 * The position of each passage when all of them are in name order. Comparing names is slow, so it is
 * done once for all passages: sorting hits by that position is then a sort of numbers.
 */
export function rankNames(passages: ReadonlyArray<{ id: number; name: string }>) {
  const ranks = new Map<number, number>();
  passages
    .toSorted((a, b) => collator.compare(a.name, b.name))
    .forEach((passage, rank) => ranks.set(passage.id, rank));
  return ranks;
}

/**
 * The order is made by sorting a copy (the input is the search result and stays as it is).
 * 'match' and 'source' are the order the search gives them in.
 */
export function sortPassageHits(
  hits: readonly PassageHit[],
  sort: PassageSort,
  lookups: {
    /** Where the passage is when all passages are in name order, see `rankNames` */
    getNameRank: (key: number) => number;
    /** Everywhere the query was found in the passage: name, tags and content */
    getMatchCount: (hit: PassageHit) => number;
  },
): PassageHit[] {
  if (sort === 'match') return hits.slice();
  // A stable sort: hits with as many matches stay in best-match order
  if (sort === 'most-matches') {
    // Counting is the work: it is done once per hit, not once per comparison
    const counts = new Map(hits.map((hit) => [hit, lookups.getMatchCount(hit)]));
    return hits.toSorted((a, b) => counts.get(b)! - counts.get(a)!);
  }
  const direction = sort === 'name-asc' ? 1 : -1;
  return hits.toSorted(
    (a, b) => direction * (lookups.getNameRank(a.key) - lookups.getNameRank(b.key)),
  );
}

export function sortStateHits(
  hits: readonly StateHit[],
  sort: StateSort,
  /** Higher = changed more recently; 0 = not changed in the history that is known */
  getLastChange: (key: string) => number,
): StateHit[] {
  switch (sort) {
    case 'source':
      return hits.slice();
    case 'path-asc':
      return hits.toSorted((a, b) => collator.compare(a.pathText, b.pathText));
    case 'path-desc':
      return hits.toSorted((a, b) => collator.compare(b.pathText, a.pathText));
    case 'type':
      return hits.toSorted(
        (a, b) => typeRank(a.type) - typeRank(b.type) || collator.compare(a.pathText, b.pathText),
      );
    case 'recent':
      return hits.toSorted((a, b) => getLastChange(b.key) - getLastChange(a.key));
  }
}
