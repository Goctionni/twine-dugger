import { describe, expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeObject } from '@/shared/shared-types';

import { createMatcher } from '../ui/SearchBar/matcher';
import { countTypes, searchState } from './state-search';
import { createDefaultOptions, type Matcher, type SearchOptions, type StateScope } from './types';

const q = (searchText: string, options: Partial<SearchOptions> = {}): Matcher => {
  const result = createMatcher({ searchText, options: { ...createDefaultOptions(), ...options } });
  if (!result.ok) throw new Error('expected a valid search');
  return result.matcher;
};
const scope = (overrides: Partial<StateScope> = {}): StateScope => ({
  path: true,
  value: true,
  ...overrides,
});

const state: JSONSafeObject = {
  player: { 'name': 'Alice', 'gold': 120, 'alive': true, 'spare key': 'rusty' },
  inventory: ['sword', 'potion', 3],
  seen: [SET_MARKER, 'cave', 'castle'],
  visits: { [TYPE_KEY]: 'Map', 'home': 4, 'far-away': 1 },
  counts: { [TYPE_KEY]: 'NumberMap', '12': 'twelve' },
  onTick: { [TYPE_KEY]: 'function', name: 'zzfn' },
  today: { [TYPE_KEY]: 'Date', value: '2020-01-01' },
};

const run = (text: string, s: Partial<StateScope> = {}, options: Partial<SearchOptions> = {}) =>
  searchState(state, q(text, options), scope(s));
const paths = (text: string, s: Partial<StateScope> = {}) =>
  run(text, s).map((hit) => hit.pathText);

describe('searchState', () => {
  it('matches keys of objects, and the value of strings, numbers and booleans', () => {
    expect(paths('gold')).toEqual(['player.gold']);
    expect(paths('alice')).toEqual(['player.name']);
    expect(paths('true')).toEqual(['player.alive']);
    expect(paths('12')).toEqual(['player.gold', 'counts.get(12)']);
  });

  it('finds containers by their key', () => {
    const hits = run('inventory');
    expect(hits).toMatchObject([{ pathText: 'inventory', type: 'array', value: undefined }]);
  });

  it('does not match array indexes or the position in a set', () => {
    expect(searchState({ list: ['x', 'y'] }, q('1'), scope())).toEqual([]);
    expect(paths('cave')).toEqual(['seen[0]']);
  });

  it('does not match the type marker', () => {
    expect(paths('Map')).toEqual([]);
    expect(paths('NumberMap')).toEqual([]);
  });

  it('does not look inside functions and dates', () => {
    expect(paths('zzfn')).toEqual([]);
    expect(paths('2020')).toEqual([]);
    expect(paths('onTick')).toEqual(['onTick']);
  });

  it('writes the path the way the state view does', () => {
    expect(paths('rusty')).toEqual(['player["spare key"]']);
    expect(paths('sword')).toEqual(['inventory[0]']);
    expect(paths('far')).toEqual(['visits.get("far-away")']);
    expect(paths('twelve')).toEqual(['counts.get(12)']);
  });

  it('gives the path as a path, and the key as how it is found again', () => {
    const [hit] = run('home');
    expect(hit).toMatchObject({ path: ['visits', 'home'], key: '["visits","home"]', value: 4 });
  });

  it('puts ranges where the text is shown', () => {
    const [hit] = run('gold');
    expect(hit?.pathRanges).toEqual([[7, 11]]);
    expect(hit?.pathText.slice(7, 11)).toBe('gold');

    const [spare] = run('spare');
    expect(spare?.pathText.slice(...(spare!.pathRanges[0] as [number, number]))).toBe('spare');

    const [value] = run('lic');
    expect(value?.valueRanges).toEqual([[1, 4]]);

    const [mapKey] = run('far');
    expect(mapKey?.pathText.slice(...(mapKey!.pathRanges[0] as [number, number]))).toBe('far');
  });

  it('can match a key and a value of the same node', () => {
    const hits = searchState({ gold: 'gold' }, q('gold'), scope());
    expect(hits).toMatchObject([{ pathRanges: [[0, 4]], valueRanges: [[0, 4]] }]);
  });

  it('only searches what the scope allows', () => {
    expect(paths('gold', { path: false })).toEqual([]);
    expect(paths('alice', { value: false })).toEqual([]);
    expect(paths('alice', { path: false })).toEqual(['player.name']);
    expect(paths('alice', { path: false, value: false })).toEqual([]);
  });

  it('keeps the order of the state', () => {
    expect(paths('e')).toEqual(
      expect.arrayContaining(['player', 'player.name', 'inventory', 'seen']),
    );
    const found = paths('e');
    expect(found.indexOf('player')).toBeLessThan(found.indexOf('inventory'));
    expect(found.indexOf('inventory')).toBeLessThan(found.indexOf('seen'));
  });

  it('counts the hits per type', () => {
    expect(countTypes(run('a'))).toMatchObject({ string: expect.any(Number) });
    expect(countTypes(run('gold'))).toEqual({ number: 1 });
  });

  it('applies whole word and case sensitivity', () => {
    expect(run('alice', {}, { caseSensitive: true })).toEqual([]);
    expect(run('Alic', {}, { wholeWord: true })).toEqual([]);
    expect(run('Alice', {}, { wholeWord: true })).toHaveLength(1);
  });
});
