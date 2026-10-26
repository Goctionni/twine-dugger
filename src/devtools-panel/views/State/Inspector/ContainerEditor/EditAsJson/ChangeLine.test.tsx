import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { ChangeLine } from './ChangeLine';
import type { Change } from './compare-json';

afterEach(cleanup);

const show = (change: Change, isLocked = false) =>
  render(() => <ChangeLine change={change} isLocked={isLocked} />).container;

it('says what is added, with its value', () => {
  expect(show({ op: 'add', key: 'gold', after: 5 }).textContent).toBe('add gold = 5');
});

it('says what is deleted', () => {
  expect(show({ op: 'delete', key: 'gold', before: 5 }).textContent).toBe('delete gold');
});

it('says what is set, from what to what', () => {
  expect(show({ op: 'set', key: 'gold', before: 5, after: 6 }).textContent).toBe('gold 5 → 6');
});

it('says when a change is of the type, too', () => {
  expect(show({ op: 'set', key: 'gold', before: 5, after: 'five' }).textContent).toBe(
    'gold 5 → "five" (number → string)',
  );
});

it('cuts a long value short', () => {
  const text = show({ op: 'add', key: 'log', after: 'x'.repeat(100) }).textContent!;
  expect(text.endsWith('…')).toBe(true);
  expect(text.length).toBeLessThan(60);
});

it('writes a value that is gone as undefined', () => {
  expect(show({ op: 'add', key: 'a', after: undefined }).textContent).toBe('add a = undefined');
});

it('is red as a whole when the property is locked, and not only its word', () => {
  const added = show({ op: 'add', key: 'a', after: 1 }, true);
  expect(added.firstElementChild!.className).toContain('text-red-400');
  expect(added.querySelector('.text-green-400')).toBeNull();
  cleanup();

  const free = show({ op: 'add', key: 'a', after: 1 });
  expect(free.firstElementChild!.className).not.toContain('text-red-400');
  expect(free.querySelector('.text-green-400')).not.toBeNull();
});
