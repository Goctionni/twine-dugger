/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../views/Search/SearchInput', () => ({
  SearchInput: () => <div data-testid="search-input" />,
}));

vi.mock('../views/Search/SearchResults', () => ({
  SearchResults: () => <div data-testid="search-results" />,
}));

import { SearchPage } from './SearchPage';

afterEach(() => cleanup());

describe('SearchPage', () => {
  it('should render input and result sections', () => {
    render(() => <SearchPage />);

    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByTestId('search-results')).toBeTruthy();
  });
});
