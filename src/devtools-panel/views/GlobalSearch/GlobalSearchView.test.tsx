import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { JSONSafeObject, ParsedPassageData } from '@/shared/shared-types';

import { setStore } from '../../store/store';
import { GlobalSearchView } from './GlobalSearchView';
import * as passageSearch from './logic/passage-search';
import * as stateSearch from './logic/state-search';
import * as gameData from './store-helpers/game-data';
import {
  clearTags,
  resetFilters,
  setPassageSort,
  setStateSort,
  togglePassageScope,
  toggleStateScope,
  toggleTag,
  toggleType,
} from './store-helpers/search-state';
import { setView, type ResultsView } from './subcomponents/results-view';
import { createDefaultScope, createDefaultSort } from './types';

// The detail pane reaches the extension api when it is imported; this page never calls it
vi.hoisted(() => {
  (globalThis as { chrome?: unknown }).chrome = { devtools: {} };
});

vi.mock('./logic/passage-search', { spy: true });
vi.mock('./logic/state-search', { spy: true });
// The game that is being inspected: the test changes it through the controls it is given
vi.mock('./store-helpers/game-data', async () => {
  const { createSignal } = await import('solid-js');
  const [passages, setPassages] = createSignal<readonly unknown[]>([]);
  const [version, setVersion] = createSignal(0);
  let state: unknown = {};
  return {
    getPassages: passages,
    getStateVersion: version,
    getUntrackedState: () => state,
    getLastChange: () => 0,
    controls: {
      setPassages,
      changeState(next: unknown) {
        state = next;
        setVersion((current) => current + 1);
      },
    },
  };
});
const controls = (
  gameData as unknown as {
    controls: {
      setPassages(passages: readonly ParsedPassageData[]): void;
      changeState(state: JSONSafeObject): void;
    };
  }
).controls;

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

// jsdom has no layout: give every element a size, so that the virtualizer has a window to fill
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 600 });
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// jsdom has no idle callbacks: the search starts when the test says the browser is idle
const idle: Array<() => void> = [];

let host: HTMLElement;
let stop: () => void;

const settle = async () => {
  flush();
  await Promise.resolve();
  flush();
};
const input = () => host.querySelector<HTMLInputElement>('input[placeholder^="Search"]')!;
const type = async (text: string) => {
  input().value = text;
  input().dispatchEvent(new InputEvent('input', { bubbles: true }));
  idle.splice(0).forEach((callback) => callback());
  await settle();
};
const toggleButton = (title: string) =>
  host.querySelector<HTMLButtonElement>(`[title="${title}"]`)!;

/** What the rows say: the name of the passage, or the path of the state */
const rows = () => [...host.querySelectorAll('li')];
const titleOf = (row: Element) => row.querySelector('span.truncate[title]')!.getAttribute('title');
const titles = () => rows().map(titleOf);

const show = async (view: ResultsView) => {
  setView(view);
  await settle();
};

const passageRuns = () => vi.mocked(passageSearch.searchPassages).mock.calls.length;
const stateRuns = () => vi.mocked(stateSearch.searchState).mock.calls.length;

beforeEach(async () => {
  idle.length = 0;
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => idle.push(callback));
  setStore((draft) => {
    draft.viewState.search = {
      scope: createDefaultScope(),
      sort: createDefaultSort(),
      typeFilter: [],
      tagFilter: [],
    };
  });
  controls.setPassages(passages);
  controls.changeState(state);
  setView('passage');
  flush();

  host = document.createElement('div');
  document.body.append(host);
  stop = render(() => <GlobalSearchView />, host);
  await settle();

  // What was searched for stays when the page is left: start from nothing
  if (input().value) await type('');
  for (const title of ['Match case', 'Match whole word', 'Regular expression']) {
    if (toggleButton(title).getAttribute('aria-pressed') === 'true') toggleButton(title).click();
  }
  await settle();
  vi.mocked(passageSearch.searchPassages).mockClear();
  vi.mocked(stateSearch.searchState).mockClear();
});
afterEach(() => {
  stop();
  host.remove();
  vi.unstubAllGlobals();
});

describe('the results', () => {
  it('has no results without a query', () => {
    expect(host.textContent).toContain('Type to search');
    expect(rows()).toHaveLength(0);
    expect(stateRuns()).toBe(0);
  });

  it('finds passages and state, passages by name first', async () => {
    await type('girl');
    expect(titles()).toEqual(['Girl Talk', 'Start', 'Bath']);
    await show('state');
    expect(titles()).toEqual(['girl', 'girlAge', 'nested.girl']);
  });

  it('empties the results when the query is cleared', async () => {
    await type('girl');
    await type('');
    expect(rows()).toHaveLength(0);
  });

  it('shows nothing for a regex that is not valid, and finds again when it is', async () => {
    toggleButton('Regular expression').click();
    await settle();
    await type('(');
    expect(rows()).toHaveLength(0);
    expect(host.textContent).toContain('⚠');
    await type('g(i)rl');
    expect(titles()).toEqual(['Girl Talk', 'Start', 'Bath']);
    expect(host.textContent).not.toContain('⚠');
  });
});

describe('what is searched again', () => {
  it('does not search the passages when only the state changes, and the reverse', async () => {
    await type('girl');
    expect([passageRuns(), stateRuns()]).toEqual([1, 1]);

    controls.changeState({ ...state, girl: 'Bella' });
    await settle();
    expect([passageRuns(), stateRuns()]).toEqual([1, 2]);

    controls.setPassages([...passages, passage(6, 'Girl', 'x')]);
    await settle();
    expect([passageRuns(), stateRuns()]).toEqual([2, 2]);
  });

  it('does not search again for filters, sorting or the other scope', async () => {
    await type('girl');
    toggleTag('intro');
    toggleType('string');
    setPassageSort('name-asc');
    setStateSort('path-desc');
    toggleStateScope('value');
    await settle();
    expect(passageRuns()).toBe(1);
    // The state scope changed, so that one does search again
    expect(stateRuns()).toBe(2);

    togglePassageScope('content');
    await settle();
    expect(passageRuns()).toBe(2);
    expect(stateRuns()).toBe(2);
  });

  it('does not search again when the filters are reset and the scope did not change', async () => {
    await type('girl');
    setPassageSort('name-asc');
    toggleTag('intro');
    await settle();
    expect([passageRuns(), stateRuns()]).toEqual([1, 1]);

    // Makes a new scope, with the same flags
    resetFilters();
    await settle();
    expect([passageRuns(), stateRuns()]).toEqual([1, 1]);
  });
});

describe('identity', () => {
  const observe = () => {
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((list) => records.push(...list));
    observer.observe(host, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    return () => {
      observer.takeRecords().forEach((record) => records.push(record));
      observer.disconnect();
      return records;
    };
  };

  it('leaves the rows of hits that stay alone when the query changes', async () => {
    await type('girl');
    const before = rows();
    expect(before).toHaveLength(3);

    const stopObserving = observe();
    // Same hits, same matches: only the case of the query is different
    await type('GIRL');
    expect(rows()).toEqual(before);
    expect(stopObserving()).toHaveLength(0);
  });

  it('keeps the row of a hit that is left when a filter takes another away', async () => {
    await type('girl');
    const girlTalk = rows()[0];
    toggleTag('dialogue');
    await settle();

    expect(titles()).toEqual(['Girl Talk', 'Bath']);
    expect(rows()[0]).toBe(girlTalk);
  });

  it('keeps the rows when only the order changes', async () => {
    await type('girl');
    const before = new Set(rows());
    setPassageSort('name-asc');
    await settle();
    expect(titles()).toEqual(['Bath', 'Girl Talk', 'Start']);
    for (const row of rows()) expect(before.has(row)).toBe(true);
  });
});

describe('filters and sorting', () => {
  it('filters passages by tag: any of the tags', async () => {
    await type('girl');
    toggleTag('dialogue');
    await settle();
    expect(titles()).toEqual(['Girl Talk', 'Bath']);
    toggleTag('intro');
    await settle();
    expect(titles()).toEqual(['Girl Talk', 'Start', 'Bath']);
    clearTags();
    await settle();
    expect(titles()).toHaveLength(3);
  });

  it('filters state by type', async () => {
    await show('state');
    await type('girl');
    toggleType('number');
    await settle();
    expect(titles()).toEqual(['girlAge']);
  });

  it('leaves the totals as the search found them', async () => {
    await type('girl');
    toggleTag('intro');
    await settle();
    const text = host.textContent ?? '';
    expect(text).toContain('Passages · 3');
    expect(text).toContain('2 of 3');
  });

  it('sorts passages by name, and back to best match', async () => {
    await type('girl');
    setPassageSort('name-asc');
    await settle();
    expect(titles()).toEqual(['Bath', 'Girl Talk', 'Start']);
    setPassageSort('name-desc');
    await settle();
    expect(titles()).toEqual(['Start', 'Girl Talk', 'Bath']);
    setPassageSort('match');
    await settle();
    expect(titles()).toEqual(['Girl Talk', 'Start', 'Bath']);
  });

  it('sorts passages by how often they match', async () => {
    await type('the');
    setPassageSort('most-matches');
    await settle();
    // "the girl and the cat" has it twice
    expect(titles()[0]).toBe('Bath');
  });

  it('sorts state by path', async () => {
    await show('state');
    await type('girl');
    setStateSort('path-desc');
    await settle();
    expect(titles()).toEqual(['nested.girl', 'girlAge', 'girl']);
  });
});
