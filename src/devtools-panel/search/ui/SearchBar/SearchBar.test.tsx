import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { setSetting, store } from '../../../store/store';
import type { Matcher } from '../../core/types';
import { SearchBar } from './SearchBar';

// jsdom has no idle callbacks: these wait until the test says the browser is idle
const idle: Array<() => void> = [];
const timeouts: Array<number | undefined> = [];
const becomeIdle = () => {
  idle.splice(0).forEach((callback) => callback());
  flush();
};

let host: HTMLElement;
let stop: () => void;
let setMatcher: ReturnType<typeof vi.fn<(matcher: Matcher | null) => void>>;

beforeEach(() => {
  idle.length = 0;
  timeouts.length = 0;
  vi.stubGlobal('requestIdleCallback', (callback: () => void, options?: { timeout?: number }) => {
    idle.push(callback);
    timeouts.push(options?.timeout);
    return idle.length;
  });

  setMatcher = vi.fn();
  host = document.createElement('div');
  document.body.append(host);
  stop = render(() => <SearchBar layout="full-sidebar" setMatcher={setMatcher} />, host);
  flush();
});
afterEach(() => {
  stop();
  host.remove();
  vi.unstubAllGlobals();
});

const lastMatcher = () => setMatcher.mock.lastCall![0];
const toggle = (title: string) => host.querySelector<HTMLButtonElement>(`[title="${title}"]`)!;
/** The state of the toggle can be left over from another test: the search text and options stay */
const setToggle = (title: string, on: boolean) => {
  if ((toggle(title).getAttribute('aria-pressed') === 'true') !== on) toggle(title).click();
  flush();
};
const input = () => host.querySelector('input')!;
/** Typed, but the browser is not idle yet */
const typeKey = (text: string) => {
  input().value = text;
  input().dispatchEvent(new InputEvent('input', { bubbles: true }));
};
const type = (text: string) => {
  typeKey(text);
  becomeIdle();
};

describe('typing', () => {
  it('does not search before the browser is idle, and then searches for what was typed by then', () => {
    setToggle('Regular expression', false);
    setMatcher.mockClear();
    typeKey('gir');
    typeKey('girl');
    expect(setMatcher).not.toHaveBeenCalled();
    // One search for both keys
    expect(idle).toHaveLength(1);

    becomeIdle();
    expect(setMatcher).toHaveBeenCalledOnce();
    expect(lastMatcher()?.query.searchText).toBe('girl');
    expect(lastMatcher()?.test('the girl')).toBe(true);
  });

  it('does not wait for idle time for ever', () => {
    typeKey('x');
    expect(timeouts[0]).toBeGreaterThan(0);
    expect(timeouts[0]).toBeLessThanOrEqual(100);
    becomeIdle();
  });

  it('can be used again afterwards', () => {
    type('x');
    type('xy');
    expect(lastMatcher()?.query.searchText).toBe('xy');
  });

  it('gives no matcher for no text, and when the text is cleared', () => {
    type('girl');
    host.querySelector<HTMLButtonElement>('[title="Clear"]')!.click();
    flush();
    expect(lastMatcher()).toBeNull();
  });

  it('does not search for what was typed before the text was cleared', () => {
    type('girl');
    typeKey('girls');
    host.querySelector<HTMLButtonElement>('[title="Clear"]')!.click();
    flush();
    becomeIdle();
    expect(lastMatcher()).toBeNull();
  });
});

describe('options', () => {
  it('shows why an invalid regex cannot be searched for, and gives no matcher', () => {
    setToggle('Regular expression', true);
    type('(');
    expect(lastMatcher()).toBeNull();
    expect(host.textContent).toContain('⚠');

    type('g(i)rl');
    expect(lastMatcher()?.test('girl')).toBe(true);
    expect(host.textContent).not.toContain('⚠');
    setToggle('Regular expression', false);
  });

  it('keeps the options in the settings only when asked to', () => {
    setSetting('search.persist.options', false);
    setToggle('Match case', false);
    flush();
    setToggle('Match case', true);
    flush();
    expect(store.settings['search.saved.options'].caseSensitive).toBe(false);

    setSetting('search.persist.options', true);
    flush();
    expect(store.settings['search.saved.options'].caseSensitive).toBe(true);
    setToggle('Match case', false);
    flush();
    expect(store.settings['search.saved.options'].caseSensitive).toBe(false);
    setSetting('search.persist.options', false);
  });
});
