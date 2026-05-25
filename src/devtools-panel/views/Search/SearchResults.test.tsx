/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setViewStateMock, getResultTabMock, getSearchResultsMock } = vi.hoisted(() => ({
  setViewStateMock: vi.fn(),
  getResultTabMock: vi.fn(),
  getSearchResultsMock: vi.fn(),
}));

vi.mock('../../store', () => ({
  createGetViewState: vi.fn(() => getResultTabMock),
  setViewState: setViewStateMock,
}));

vi.mock('./create-searchResults', () => ({
  createSearchResults: vi.fn(() => getSearchResultsMock),
}));

vi.mock('./StateResults', () => ({
  StateResults: (props: { results: unknown[] }) => (
    <div data-testid="state-results">state:{props.results.length}</div>
  ),
}));

vi.mock('./PassageResults', () => ({
  PassageResults: (props: { results: unknown[] }) => (
    <div data-testid="passage-results">passage:{props.results.length}</div>
  ),
}));

import { SearchResults } from './SearchResults';

afterEach(() => cleanup());

describe('SearchResults', () => {
  beforeEach(() => {
    setViewStateMock.mockReset();
    getResultTabMock.mockReset();
    getSearchResultsMock.mockReset();
    getResultTabMock.mockReturnValue(null);
  });

  it('should render nothing when there are no results', () => {
    getSearchResultsMock.mockReturnValue({ state: [], passage: [] });

    render(() => <SearchResults />);

    expect(screen.queryByText('Search results')).toBeNull();
  });

  it('should show state tab and state results as default active when tab is unset', () => {
    getSearchResultsMock.mockReturnValue({ state: [{ path: ['a'], value: 1 }], passage: [] });

    render(() => <SearchResults />);

    expect(screen.getByRole('button', { name: /State \(1\)/ })).toBeTruthy();
    expect(screen.getByTestId('state-results').textContent).toBe('state:1');
    expect(screen.queryByTestId('passage-results')).toBeNull();
  });

  it('should render passage pane when passage tab is active', () => {
    getResultTabMock.mockReturnValue('passage');
    getSearchResultsMock.mockReturnValue({
      state: [{ path: ['a'], value: 1 }],
      passage: [{ id: 1, name: 'Start' }],
    });

    render(() => <SearchResults />);

    expect(screen.getByTestId('passage-results').textContent).toBe('passage:1');
    expect(screen.queryByTestId('state-results')).toBeNull();
  });

  it('should dispatch setViewState when tab button is clicked', async () => {
    const user = userEvent.setup();
    getResultTabMock.mockReturnValue('passage');
    getSearchResultsMock.mockReturnValue({
      state: [{ path: ['a'], value: 1 }],
      passage: [{ id: 1, name: 'Start' }],
    });

    render(() => <SearchResults />);
    await user.click(screen.getByRole('button', { name: /State \(1\)/ }));

    expect(setViewStateMock).toHaveBeenCalledWith('search', 'resultTab', 'state');
  });
});
