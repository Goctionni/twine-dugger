import { createRoot, createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { JSONSafeObject, ParsedPassageData } from '@/shared/shared-types';

import { setStore } from '../../store/store';
import * as passageSearch from '../core/passage-search';
import * as stateSearch from '../core/state-search';
import { defaultSearchOptions, defaultSearchScope, defaultSearchSort } from '../core/types';
import { createSearch, type SearchData } from './create-search';
import {
  clearTags,
  setQuery,
  setSort,
  toggleOption,
  toggleScope,
  toggleTag,
  toggleType,
} from './search-state';

vi.mock('../core/passage-search', { spy: true });
vi.mock('../core/state-search', { spy: true });

const passage = (
  id: number,
  name: string,
  content: string,
  tags: string[] = [],
): ParsedPassageData => ({ id, name, content, tags, size: null, position: null });

const passages = [
  passage(1, 'Start', 'the girl walks in', ['intro']),
  passage(2, 'Girl Talk', 'hello', ['dialogue']),
  passage(3, 'Bath', 'the girl and the cat', ['dialogue', 'intro']),
  passage(4, 'Cat', 'meow'),
  passage(5, 'Aardvark', 'nothing'),
];

const state: JSONSafeObject = { girl: 'Anna', girlAge: 20, cat: 'Tom', nested: { girl: true } };

function setup() {
  const [getPassages, setPassages] = createSignal<readonly ParsedPassageData[]>(passages);
  const [version, setVersion] = createSignal(0);
  let current: JSONSafeObject = state;
  const data: SearchData = {
    passages: getPassages,
    stateVersion: version,
    getState: () => current,
    getLastChange: () => 0,
  };
  const dispose = vi.fn();
  const search = createRoot((d) => {
    dispose.mockImplementation(d);
    return createSearch(data);
  }, {});
  return {
    search,
    dispose,
    setPassages: (next: readonly ParsedPassageData[]) => (setPassages(next), flush()),
    changeState: (next: JSONSafeObject) => ((current = next), setVersion((v) => v + 1), flush()),
  };
}

const type = (text: string) => (setQuery(text), flush());
const keys = (list: readonly { key: unknown }[]) => list.map((hit) => hit.key);
const calls = (spy: unknown) => (spy as { mock: { calls: unknown[][] } }).mock.calls;

let fixture: ReturnType<typeof setup>;
beforeEach(() => {
  setStore((draft) => {
    draft.viewState.search = {
      query: '',
      options: { ...defaultSearchOptions },
      scope: { ...defaultSearchScope },
      sort: { ...defaultSearchSort },
      typeFilter: [],
      tagFilter: [],
      view: 'both',
      collapsed: { state: false, passage: false },
    };
  });
  flush();
  vi.mocked(passageSearch.searchPassages).mockClear();
  vi.mocked(stateSearch.searchState).mockClear();
  fixture = setup();
});
afterEach(() => fixture.dispose());

describe('createSearch', () => {
  it('has no results without a query', () => {
    const { search } = fixture;
    expect(search.hasQuery()).toBe(false);
    expect(search.passageList).toHaveLength(0);
    expect(search.stateList).toHaveLength(0);
    expect(passageSearch.searchPassages).not.toHaveBeenCalled();
  });

  it('finds passages and state, passages by name first', () => {
    type('girl');
    expect(keys(fixture.search.passageList)).toEqual([2, 1, 3]);
    expect(keys(fixture.search.stateList)).toEqual([
      '["girl"]',
      '["girlAge"]',
      '["nested","girl"]',
    ]);
    expect(fixture.search.passageTotal()).toBe(3);
  });

  it('empties the results when the query is cleared', () => {
    type('girl');
    type('');
    expect(fixture.search.passageList).toHaveLength(0);
    expect(fixture.search.stateList).toHaveLength(0);
  });

  it('reports an invalid regex and shows nothing', () => {
    toggleOption('regex');
    type('(');
    expect(fixture.search.error()).toBeTruthy();
    expect(fixture.search.hasQuery()).toBe(false);
    expect(fixture.search.passageList).toHaveLength(0);
    type('g(i)rl');
    expect(fixture.search.error()).toBeNull();
    expect(fixture.search.passageList.length).toBeGreaterThan(0);
  });
});

describe('what is searched again', () => {
  const passageRuns = () => calls(passageSearch.searchPassages).length;
  const stateRuns = () => calls(stateSearch.searchState).length;

  it('does not search the passages when only the state changes, and the reverse', () => {
    type('girl');
    expect([passageRuns(), stateRuns()]).toEqual([1, 1]);

    fixture.changeState({ ...state, girl: 'Bella' });
    expect([passageRuns(), stateRuns()]).toEqual([1, 2]);

    fixture.setPassages([...passages, passage(6, 'Girl', 'x')]);
    expect([passageRuns(), stateRuns()]).toEqual([2, 2]);
  });

  it('does not search again for filters, sorting or the other scope', () => {
    type('girl');
    toggleTag('intro');
    toggleType('string');
    setSort('passage', 'name-asc');
    setSort('state', 'path-desc');
    toggleScope('stateValue');
    flush();
    expect(passageRuns()).toBe(1);
    // The state scope changed, so that one does search again
    expect(stateRuns()).toBe(2);
    toggleScope('passageContent');
    flush();
    expect(passageRuns()).toBe(2);
    expect(stateRuns()).toBe(2);
  });

  it('does not search again for options that are switched and switched back', () => {
    type('girl');
    toggleOption('caseSensitive');
    toggleOption('caseSensitive');
    flush();
    expect(passageRuns()).toBe(1);
    expect(stateRuns()).toBe(1);
  });

  it('searches inside the previous hits when the query grows', () => {
    type('g');
    const first = calls(passageSearch.searchPassages)[0]![0] as unknown[];
    type('gi');
    type('girl');
    const [, second, third] = calls(passageSearch.searchPassages).map(
      (args) => args[0] as unknown[],
    );
    expect(first).toHaveLength(passages.length);
    expect(second!.length).toBeLessThan(passages.length);
    expect(third!.length).toBeLessThanOrEqual(second!.length);
  });

  it('does not narrow for another query, whole words, regexes or other passages', () => {
    const lastCandidates = () => calls(passageSearch.searchPassages).at(-1)![0] as unknown[];
    type('girl');
    type('cat');
    expect(lastCandidates()).toHaveLength(passages.length);

    toggleOption('wholeWord');
    type('cat ');
    type('cat');
    expect(lastCandidates()).toHaveLength(passages.length);
    toggleOption('wholeWord');

    type('c');
    fixture.setPassages(passages.slice());
    expect(lastCandidates()).toHaveLength(passages.length);
  });

  it('gives the same results narrowed as searched from scratch', () => {
    type('g');
    type('gir');
    const narrowed = keys(fixture.search.passageList);
    fixture.dispose();
    setStore((draft) => {
      draft.viewState.search.query = '';
    });
    fixture = setup();
    type('gir');
    expect(keys(fixture.search.passageList)).toEqual(narrowed);
  });
});

describe('identity', () => {
  it('keeps a hit that is still there as the same object', () => {
    type('girl');
    const before = new Map(fixture.search.passageList.map((hit) => [hit.key, hit]));
    type('girl ');
    const after = fixture.search.passageList;
    expect(after.length).toBeGreaterThan(0);
    for (const hit of after) expect(hit).toBe(before.get(hit.key));
  });

  it('keeps a hit when only its matches move (a longer query)', () => {
    type('the');
    const bath = fixture.search.passageList.find((hit) => hit.key === 3);
    type('the girl');
    expect(fixture.search.passageList.find((hit) => hit.key === 3)).toBe(bath);
  });

  it('keeps the hits when only the order changes', () => {
    type('girl');
    const before = new Map(fixture.search.passageList.map((hit) => [hit.key, hit]));
    setSort('passage', 'name-asc');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([3, 2, 1]);
    for (const hit of fixture.search.passageList) expect(hit).toBe(before.get(hit.key));
  });

  it('keeps hits when a filter is taken away again', () => {
    type('girl');
    const before = new Map(fixture.search.passageList.map((hit) => [hit.key, hit]));
    toggleTag('intro');
    flush();
    toggleTag('intro');
    flush();
    for (const hit of fixture.search.passageList) expect(hit).toBe(before.get(hit.key));
  });
});

describe('filters and sorting', () => {
  it('filters passages by tag: any of the tags', () => {
    type('girl');
    toggleTag('dialogue');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([2, 3]);
    toggleTag('intro');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([2, 1, 3]);
    clearTags();
    flush();
    expect(fixture.search.passageList).toHaveLength(3);
  });

  it('filters state by type', () => {
    type('girl');
    toggleType('number');
    flush();
    expect(keys(fixture.search.stateList)).toEqual(['["girlAge"]']);
  });

  it('leaves the totals and the counts as the search found them', () => {
    type('girl');
    toggleTag('intro');
    toggleType('number');
    flush();
    expect(fixture.search.passageTotal()).toBe(3);
    expect(fixture.search.stateTotal()).toBe(3);
    expect(Object.fromEntries(fixture.search.tagCounts())).toEqual({
      intro: 2,
      dialogue: 2,
    });
    expect(fixture.search.typeCounts()).toMatchObject({ number: 1, string: 1, boolean: 1 });
  });

  it('sorts passages by name, and back to best match', () => {
    type('girl');
    setSort('passage', 'name-asc');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([3, 2, 1]);
    setSort('passage', 'name-desc');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([1, 2, 3]);
    setSort('passage', 'match');
    flush();
    expect(keys(fixture.search.passageList)).toEqual([2, 1, 3]);
  });

  it('sorts state by path', () => {
    type('girl');
    setSort('state', 'path-desc');
    flush();
    expect(fixture.search.stateList.map((hit) => hit.pathText)).toEqual([
      'nested.girl',
      'girlAge',
      'girl',
    ]);
  });
});

describe('selection', () => {
  it('marks one result as selected, and only that one', () => {
    const { selection } = fixture.search;
    selection.select({ section: 'passage', key: 1 });
    flush();
    expect(selection.isSelected('passage', 1)).toBe(true);
    expect(selection.isSelected('passage', 2)).toBe(false);
    expect(selection.isSelected('state', 1)).toBe(false);

    selection.select({ section: 'passage', key: 2 });
    flush();
    expect(selection.isSelected('passage', 1)).toBe(false);
    expect(selection.isSelected('passage', 2)).toBe(true);

    selection.select(null);
    flush();
    expect(selection.isSelected('passage', 2)).toBe(false);
    expect(selection.selected()).toBeNull();
  });
});
