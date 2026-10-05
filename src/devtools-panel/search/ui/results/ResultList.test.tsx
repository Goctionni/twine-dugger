import { render } from '@solidjs/web';
import { createRoot, flush } from 'solid-js';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vite-plus/test';

import { getMarkedText, installFakeHighlights } from '@/devtools-panel/ui/util/test-highlights';
import type { ParsedPassageData } from '@/shared/shared-types';

import { setStore } from '../../../store/store';
import { defaultSearchOptions, defaultSearchScope, defaultSearchSort } from '../../core/types';
import { SearchContext } from '../../model/context';
import { createSearch } from '../../model/create-search';
import { setQuery, toggleTag } from '../../model/search-state';
import { PassageRow } from './PassageRow';
import { ResultList } from './ResultList';

const passages: ParsedPassageData[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Alpha ${i + 1}`,
  content: `content of passage ${i + 1}`,
  tags: i % 2 ? ['odd'] : ['even'],
  size: null,
  position: null,
}));

// jsdom has no layout: give every element a size, so that the virtualizer has a window to fill
beforeAll(() => {
  installFakeHighlights();
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 600 });
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

let host: HTMLElement;
let dispose: () => void;
let model: ReturnType<typeof createSearch>;

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

  host = document.createElement('div');
  document.body.append(host);
  dispose = createRoot((disposeRoot) => {
    model = createSearch({
      passages: () => passages,
      stateVersion: () => 0,
      getState: () => ({}),
      getLastChange: () => 0,
    });
    const stop = render(
      () => (
        <SearchContext value={model}>
          <ResultList items={model.passageList} order={model.passageOrder} rowHeight={54}>
            {(hit) => <PassageRow hit={hit} />}
          </ResultList>
        </SearchContext>
      ),
      host,
    );
    return () => (stop(), disposeRoot());
  });
  flush();
});
afterEach(() => {
  dispose();
  host.remove();
});

const rowElements = () => [...host.querySelectorAll('li')];
const type = async (text: string) => {
  setQuery(text);
  flush();
  await Promise.resolve();
};

describe('ResultList', () => {
  it('shows the rows that are in view, with the match marked', async () => {
    await type('alpha 1');
    const rows = rowElements();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.textContent).toContain('Alpha 1');
    expect(getMarkedText()).toContain('Alpha 1');
  });

  it('leaves the rows of hits that stay alone when the query changes', async () => {
    await type('a');
    const before = rowElements();
    expect(before.length).toBeGreaterThan(1);

    const records: MutationRecord[] = [];
    const observer = new MutationObserver((list) => records.push(...list));
    observer.observe(host, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    // Same hits, same matches: only the text of the query is different
    await type('A');
    observer.takeRecords().forEach((record) => records.push(record));
    observer.disconnect();

    expect(rowElements()).toEqual(before);
    expect(records).toHaveLength(0);
  });

  it('keeps the rows of the hits that are left when a filter takes some away', async () => {
    await type('alpha');
    const byName = new Map(rowElements().map((row) => [row.textContent, row]));
    toggleTag('odd');
    flush();
    await Promise.resolve();

    // Rows move up and new ones come in at the end; the ones that were there are the same elements
    const survivors = rowElements().filter((row) => byName.has(row.textContent));
    expect(survivors.length).toBeGreaterThan(0);
    for (const row of survivors) expect(byName.get(row.textContent)).toBe(row);
  });

  it('selects a result when it is clicked, and deselects it when it is clicked again', async () => {
    await type('alpha');
    const button = () => host.querySelector('li button') as HTMLButtonElement;
    button().click();
    flush();
    expect(model.selection.selected()).toEqual({ section: 'passage', key: 1 });
    button().click();
    flush();
    expect(model.selection.selected()).toBeNull();
  });
});
