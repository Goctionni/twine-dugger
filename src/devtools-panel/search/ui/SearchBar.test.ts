import { flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { store } from '../../store/store';
import { setSearchText } from '../model/search-state';
import { setSearchTextWhenIdle } from './SearchBar';

describe('setSearchTextWhenIdle', () => {
  // jsdom has no idle callbacks: these wait until the test says the browser is idle
  const idle: Array<() => void> = [];
  const timeouts: Array<number | undefined> = [];
  beforeEach(() => {
    idle.length = 0;
    timeouts.length = 0;
    vi.stubGlobal('requestIdleCallback', (callback: () => void, options?: { timeout?: number }) => {
      idle.push(callback);
      timeouts.push(options?.timeout);
      return idle.length;
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  const becomeIdle = () => idle.splice(0).forEach((callback) => callback());
  const searchText = () => store.viewState.search.query.searchText;

  it('does not search before the browser is idle, and then searches for what is in the input by then', () => {
    setSearchText('');
    flush();
    let typed = 'a';
    setSearchTextWhenIdle(() => typed);
    typed = 'ab';
    setSearchTextWhenIdle(() => typed);
    flush();
    expect(searchText()).toBe('');
    // One search for both keys
    expect(idle).toHaveLength(1);

    becomeIdle();
    flush();
    expect(searchText()).toBe('ab');
  });

  it('does not wait for idle time for ever', () => {
    setSearchTextWhenIdle(() => 'x');
    expect(timeouts[0]).toBeGreaterThan(0);
    expect(timeouts[0]).toBeLessThanOrEqual(100);
    becomeIdle();
  });

  it('can be used again afterwards', () => {
    setSearchTextWhenIdle(() => 'x');
    becomeIdle();
    setSearchTextWhenIdle(() => 'xy');
    becomeIdle();
    flush();
    expect(searchText()).toBe('xy');
  });
});
