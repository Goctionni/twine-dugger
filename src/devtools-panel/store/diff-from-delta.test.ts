import { create } from 'jsondiffpatch';
import { afterEach, expect, it, vi } from 'vite-plus/test';

import { TYPE_KEY } from '@/shared/json-safe';

import type { DiffChange } from '../views/DiffLog/diff-types';
import { getDiffFromDelta } from './diff-from-delta';

// The same options as the content script's update tracker
const differ = create({
  objectHash: (item, index) => (item as { id?: string }).id ?? `$$index:${index}`,
  arrays: { detectMove: true, includeValueOnMove: false },
});

const ids = (...names: string[]) => names.map((id) => ({ id }));
const text = (ending: string) =>
  `The quick brown fox jumps over the lazy dog and keeps running far away. ${ending}`;

interface Scenario {
  before: unknown;
  after: unknown;
  changes: DiffChange[];
}

const scenarios: Record<string, Scenario> = {
  'an added key': {
    before: { a: 1 },
    after: { a: 1, b: 2 },
    changes: [{ kind: 'add', path: ['b'], value: 2 }],
  },
  'a deleted key': {
    before: { a: 1, b: 2 },
    after: { a: 1 },
    changes: [{ kind: 'del', path: ['b'], value: 2 }],
  },
  'a changed number': {
    before: { a: 1 },
    after: { a: 2 },
    changes: [{ kind: 'chg', path: ['a'], oldValue: 1, newValue: 2 }],
  },
  'a long string is a change, not a text diff': {
    before: { log: text('One.') },
    after: { log: text('Two.') },
    changes: [{ kind: 'chg', path: ['log'], oldValue: text('One.'), newValue: text('Two.') }],
  },
  'a number that becomes a string': {
    before: { a: 1 },
    after: { a: 'x' },
    changes: [{ kind: 'typ', path: ['a'], oldValue: 1, newValue: 'x' }],
  },
  'null that becomes an object': {
    before: { a: null },
    after: { a: { b: 1 } },
    changes: [{ kind: 'typ', path: ['a'], oldValue: null, newValue: { b: 1 } }],
  },
  'an array that becomes an object': {
    before: { a: [1] },
    after: { a: { b: 1 } },
    changes: [{ kind: 'typ', path: ['a'], oldValue: [1], newValue: { b: 1 } }],
  },
  'a value that was undefined': {
    before: { a: undefined },
    after: { a: 1 },
    changes: [{ kind: 'add', path: ['a'], value: 1 }],
  },
  'a whole new branch is one addition': {
    before: {},
    after: { a: { b: [1, 2, { c: 3 }] } },
    changes: [{ kind: 'add', path: ['a'], value: { b: [1, 2, { c: 3 }] } }],
  },
  'changes deep inside': {
    before: { a: { b: { c: 1 } } },
    after: { a: { b: { c: 2, d: 3 } } },
    changes: [
      { kind: 'chg', path: ['a', 'b', 'c'], oldValue: 1, newValue: 2 },
      { kind: 'add', path: ['a', 'b', 'd'], value: 3 },
    ],
  },
  'an item pushed to an array': {
    before: { l: [1, 2] },
    after: { l: [1, 2, 3] },
    changes: [{ kind: 'add', path: ['l', 2], value: 3 }],
  },
  'the first item removed from an array': {
    before: { l: [1, 2, 3] },
    after: { l: [2, 3] },
    changes: [{ kind: 'del', path: ['l', 0], value: 1 }],
  },
  'an array item replaced by another': {
    before: { l: [1, 2, 3] },
    after: { l: [1, 9, 3] },
    changes: [
      { kind: 'add', path: ['l', 1], value: 9 },
      { kind: 'del', path: ['l', 1], value: 2 },
    ],
  },
  'a change inside an array item that is matched by id': {
    before: {
      l: [
        { id: 'a', n: 1 },
        { id: 'b', n: 1 },
      ],
    },
    after: {
      l: [
        { id: 'a', n: 2 },
        { id: 'b', n: 1 },
      ],
    },
    changes: [{ kind: 'chg', path: ['l', 0, 'n'], oldValue: 1, newValue: 2 }],
  },
  'an item moved in an array': {
    before: { l: ids('a', 'b', 'c') },
    after: { l: ids('b', 'c', 'a') },
    changes: [{ kind: 'mov', path: ['l'] }],
  },
  'a move next to a change is listed after it': {
    before: {
      l: [
        { id: 'a', n: 1 },
        { id: 'b', n: 1 },
        { id: 'c', n: 1 },
      ],
    },
    after: {
      l: [
        { id: 'c', n: 2 },
        { id: 'a', n: 1 },
        { id: 'b', n: 1 },
      ],
    },
    changes: [
      { kind: 'chg', path: ['l', 0, 'n'], oldValue: 1, newValue: 2 },
      { kind: 'mov', path: ['l'] },
    ],
  },
  'many moves in one array are one move': {
    before: { l: ids('a', 'b', 'c', 'd', 'e') },
    after: { l: ids('e', 'd', 'c', 'b', 'a') },
    changes: [{ kind: 'mov', path: ['l'] }],
  },
  'moves next to an addition and a deletion': {
    before: { l: ids('a', 'b', 'c', 'd') },
    after: { l: ids('d', 'x', 'a', 'c') },
    changes: [
      { kind: 'add', path: ['l', 1], value: { id: 'x' } },
      { kind: 'del', path: ['l', 1], value: { id: 'b' } },
      { kind: 'mov', path: ['l'] },
    ],
  },
  'a move in each of two arrays': {
    before: { x: ids('a', 'b'), y: ids('c', 'd') },
    after: { x: ids('b', 'a'), y: ids('d', 'c') },
    changes: [
      { kind: 'mov', path: ['x'] },
      { kind: 'mov', path: ['y'] },
    ],
  },
  'a move in a nested array': {
    before: { o: { l: ids('a', 'b') } },
    after: { o: { l: ids('b', 'a') } },
    changes: [{ kind: 'mov', path: ['o', 'l'] }],
  },
  'changes in a marked Map': {
    before: { m: { [TYPE_KEY]: 'Map', k: 1 } },
    after: { m: { [TYPE_KEY]: 'Map', k: 2, j: 3 } },
    changes: [
      { kind: 'chg', path: ['m', 'k'], oldValue: 1, newValue: 2 },
      { kind: 'add', path: ['m', 'j'], value: 3 },
    ],
  },
  'the marker of a Map is not a change': {
    before: { m: { [TYPE_KEY]: 'Map', k: 1 } },
    after: { m: { [TYPE_KEY]: 'NumberMap', k: 1 } },
    changes: [],
  },
  'the whole state replaced by another type': {
    before: { a: 1 },
    after: [1, 2],
    changes: [{ kind: 'typ', path: [], oldValue: { a: 1 }, newValue: [1, 2] }],
  },
};

afterEach(() => vi.restoreAllMocks());

for (const [name, { before, after, changes }] of Object.entries(scenarios)) {
  it(`lists ${name}`, () => {
    expect(getDiffFromDelta(differ.diff(before, after))).toEqual(changes);
  });
}

it('lists nothing when nothing changed', () => {
  expect(getDiffFromDelta(differ.diff({ a: 1 }, { a: 1 }))).toEqual([]);
});

it('works out the changes of a delta once', () => {
  const delta = differ.diff({ a: 1 }, { a: 2 });
  expect(getDiffFromDelta(delta)).toBe(getDiffFromDelta(delta));
});

it('warns about a delta it does not know, and lists nothing for it', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  expect(getDiffFromDelta({ a: ['@@ -1 +1 @@', 0, 2] })).toEqual([]);
  expect(warn).toHaveBeenCalledOnce();
});
