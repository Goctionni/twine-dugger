import { describe, expect, it } from 'vite-plus/test';

import { jsonReplacer, jsonReviver } from './json-helper';

describe('jsonReplacer', () => {
  it('should serialize Map and Set instances', () => {
    const mapValue = new Map<string, number>([['k', 1]]);
    const setValue = new Set<number>([1, 2]);

    expect(jsonReplacer('m', mapValue)).toEqual({
      ____JSON_type: 'MAP',
      entries: [['k', 1]],
    });
    expect(jsonReplacer('s', setValue)).toEqual({
      ____JSON_type: 'SET',
      values: [1, 2],
    });
  });

  it('should serialize Twine revive tuples for map and set', () => {
    expect(jsonReplacer('', ['(revive:map)', [['a', 1]]])).toEqual({
      ____JSON_type: 'MAP',
      entries: [['a', 1]],
    });

    expect(jsonReplacer('', ['(revive:set)', [1, 2]])).toEqual({
      ____JSON_type: 'SET',
      values: [1, 2],
    });
  });

  it('should mark revive eval function signatures and undefined payloads', () => {
    expect(jsonReplacer('', ['(revive:eval)', 'undefined'])).toEqual({
      ____JSON_type: 'UNDEFINED',
    });

    expect(jsonReplacer('', ['(revive:eval)', '(function named(a){ return a; })'])).toEqual({
      ____JSON_type: 'function',
    });

    expect(jsonReplacer('', ['(revive:eval)', '((a) => a + 1)'])).toEqual({
      ____JSON_type: 'function',
    });
  });
});

describe('jsonReviver', () => {
  it('should revive map and set wrappers to native types', () => {
    const map = jsonReviver('', {
      ____JSON_type: 'MAP',
      entries: [['x', 7]],
    });

    const set = jsonReviver('', {
      ____JSON_type: 'SET',
      values: ['a', 'b'],
    });

    expect(map).toBeInstanceOf(Map);
    expect((map as Map<string, number>).get('x')).toBe(7);
    expect(set).toBeInstanceOf(Set);
    expect([...(set as Set<string>).values()]).toEqual(['a', 'b']);
  });

  it('should revive function marker into callable placeholder', () => {
    const revived = jsonReviver('', { ____JSON_type: 'function' });

    expect(typeof revived).toBe('function');
    expect((revived as () => void)()).toBeUndefined();
  });

  it('should revive revive-eval undefined tuple to undefined', () => {
    expect(jsonReviver('', ['(revive:eval)', 'undefined'])).toBeUndefined();
  });
});
