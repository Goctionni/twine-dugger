import { expect, it } from 'vite-plus/test';

import {
  MARKED_VALUE_WRITE_ERROR,
  NAN_MARKER,
  POSITIVE_INFINITY_MARKER,
  SET_MARKER,
  TYPE_KEY,
  UNDEFINED_MARKER,
} from '@/shared/json-safe';

import { compareJson } from './compare-json';

const group = { a: 1, b: 'two', c: true, deep: { x: 1 }, list: [1] };
const compareGroup = (text: string) => compareJson('object', group, ['a', 'b', 'c'], text);

it('finds the changes: set, add and delete', () => {
  expect(compareGroup('{"a": 2, "b": 5, "d": 4}').changes).toEqual([
    { op: 'set', key: 'a', before: 1, after: 2 },
    { op: 'set', key: 'b', before: 'two', after: 5 },
    { op: 'add', key: 'd', after: 4 },
    { op: 'delete', key: 'c', before: true },
  ]);
  expect(compareGroup('{"a": 1, "b": "two", "c": true}').changes).toEqual([]);
});

it('says what is wrong with the text', () => {
  expect(compareGroup('{').error).toBeTruthy();
  expect(compareGroup('[1]').error).toBe('Expected an object');
  expect(compareGroup(`{"${TYPE_KEY}": "Map"}`).error).toContain('reserved');
});

it('warns about a property that is not in the edit and would be overwritten', () => {
  const result = compareGroup('{"a": 1, "b": "two", "c": true, "deep": 5}');
  expect(result.warnings).toEqual([
    '"deep" exists on this object but is not part of this edit; saving overwrites it.',
  ]);
  expect(result.changes).toEqual([{ op: 'set', key: 'deep', before: { x: 1 }, after: 5 }]);
  // The same value is no overwrite
  expect(compareGroup('{"a": 1, "b": "two", "c": true, "deep": {"x": 1}}').warnings).toEqual([]);
});

it('compares a map without its marker', () => {
  const map = { [TYPE_KEY]: 'Map', k: 1 };
  expect(compareJson('map', map, ['k'], '{"k": 1}').changes).toEqual([]);
  expect(compareJson('map', map, ['k'], '{"k": 2}').changes).toEqual([
    { op: 'set', key: 'k', before: 1, after: 2 },
  ]);
});

it('compares the items of an array by their position, and deletes from the last', () => {
  expect(compareJson('array', [1, 2, 3, 4], [], '[1, 9, 3, 4, 5]').changes).toEqual([
    { op: 'set', key: 1, before: 2, after: 9 },
    { op: 'add', key: 4, after: 5 },
  ]);
  const shorter = compareJson('array', [1, 2, 3, 4], [], '[1]');
  expect(shorter.changes.map((change) => change.key)).toEqual([3, 2, 1]);
  expect(compareJson('array', [1], [], '{}').error).toBe('Expected an array');
});

it('compares the items of a set without its marker', () => {
  const set = [SET_MARKER, 1, 2];
  expect(compareJson('set', set, [], '[1, 2]').changes).toEqual([]);
  expect(compareJson('set', set, [], '[1, 2, 3]').changes).toEqual([
    { op: 'add', key: 2, after: 3 },
  ]);
  expect(compareJson('set', set, [], JSON.stringify(set)).error).toContain('marker');
});

it('does not write NaN, an infinity or undefined, but lets one stay where it is', () => {
  const state = { a: 1, bad: NAN_MARKER, group: { n: NAN_MARKER, x: 1 } };
  const keys = ['a', 'bad', 'group'];
  const compareState = (text: string) => compareJson('object', state, keys, text);

  expect(compareState(`{"a": "${UNDEFINED_MARKER}", "bad": "${NAN_MARKER}"}`).error).toBe(
    MARKED_VALUE_WRITE_ERROR,
  );
  expect(compareState(`{"a": 1, "bad": "${POSITIVE_INFINITY_MARKER}"}`).error).toBe(
    MARKED_VALUE_WRITE_ERROR,
  );
  expect(compareState(`{"new": [1, "${NAN_MARKER}"]}`).error).toBe(MARKED_VALUE_WRITE_ERROR);

  // Unchanged markers, also inside a container that changes elsewhere, are fine
  const kept = compareState(
    `{"a": 2, "bad": "${NAN_MARKER}", "group": {"n": "${NAN_MARKER}", "x": 2}}`,
  );
  expect(kept.error).toBeUndefined();
  expect(kept.changes.map((change) => change.key)).toEqual(['a', 'group']);
  expect(compareJson('array', [1], [], `["${NAN_MARKER}"]`).error).toBe(MARKED_VALUE_WRITE_ERROR);
});
