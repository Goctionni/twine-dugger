import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal, flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { SearchResultsCombined } from '@/shared/shared-types';

const [results, setResults] = createSignal<SearchResultsCombined>({ state: [], passage: [] });
vi.mock('../../api/api', () => ({
  getPassageData: async () => [],
  setStatePropertyLocks: async () => {},
}));
vi.mock('./create-searchResults', () => ({ createSearchResults: () => results }));
// The lists have their own tests, and need a layout to render anything
vi.mock('./StateResults', () => ({ StateResults: () => <p>state list</p> }));
vi.mock('./PassageResults', () => ({ PassageResults: () => <p>passage list</p> }));

const store = await import('../../store/store');
const { SearchResults } = await import('./SearchResults');

const stateResult = { path: ['hp'], value: 1 };
const passage = { id: 1, name: 'A', content: '', tags: [], size: null, position: null };

beforeEach(() => store.setViewState('search', 'resultTab', 'state'));
afterEach(() => cleanup());

const show = (combined: SearchResultsCombined) => {
  setResults(combined);
  render(() => <SearchResults />);
  flush();
};

describe('SearchResults', () => {
  it('shows the passages when only they have results, although state is the picked tab', () => {
    show({ state: [], passage: [passage] });
    expect(screen.getByText('passage list')).toBeTruthy();
    expect(screen.queryByText('state list')).toBeNull();
    expect(screen.queryByRole('button', { name: /State/ })).toBeNull();
  });

  it('shows the state when only it has results, although passage is the picked tab', () => {
    store.setViewState('search', 'resultTab', 'passage');
    show({ state: [stateResult], passage: [] });
    expect(screen.getByText('state list')).toBeTruthy();
    expect(screen.queryByText('passage list')).toBeNull();
  });

  it('uses the picked tab when both have results', () => {
    store.setViewState('search', 'resultTab', 'passage');
    show({ state: [stateResult], passage: [passage] });
    expect(screen.getByText('passage list')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('shows nothing without results', () => {
    show({ state: [], passage: [] });
    expect(screen.queryByText('state list')).toBeNull();
    expect(screen.queryByText('passage list')).toBeNull();
  });
});
