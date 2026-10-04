import { describe, expect, it } from 'vite-plus/test';

import { SET_MARKER, TYPE_KEY } from '@/shared/json-safe';
import type { JSONSafeObject } from '@/shared/shared-types';

import { compileQuery } from './query';
import { searchState } from './state-search';
import {
  defaultSearchOptions,
  defaultSearchScope,
  type CompiledQuery,
  type SearchOptions,
  type SearchScope,
} from './types';

const q = (text: string, options: Partial<SearchOptions> = {}) =>
  compileQuery(text, { ...defaultSearchOptions, ...options }) as CompiledQuery;
const scope = (overrides: Partial<SearchScope> = {}): SearchScope => ({
  ...defaultSearchScope,
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

const run = (text: string, s: Partial<SearchScope> = {}, options: Partial<SearchOptions> = {}) =>
  searchState(state, q(text, options), scope(s));
const paths = (text: string, s: Partial<SearchScope> = {}) =>
  run(text, s).hits.map((hit) => hit.pathText);

describe('searchState', () => {
  it('matches keys of objects, and the value of strings, numbers and booleans', () => {
    expect(paths('gold')).toEqual(['player.gold']);
    expect(paths('alice')).toEqual(['player.name']);
    expect(paths('true')).toEqual(['player.alive']);
    expect(paths('12')).toEqual(['player.gold', 'counts.get(12)']);
  });

  it('finds containers by their key', () => {
    const { hits } = run('inventory');
    expect(hits).toMatchObject([{ pathText: 'inventory', type: 'array', value: undefined }]);
  });

  it('does not match array indexes or the position in a set', () => {
    expect(searchState({ list: ['x', 'y'] }, q('1'), scope()).hits).toEqual([]);
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
    const [hit] = run('home').hits;
    expect(hit).toMatchObject({ path: ['visits', 'home'], key: '["visits","home"]', value: 4 });
  });

  it('puts ranges where the text is shown', () => {
    const [hit] = run('gold').hits;
    expect(hit?.pathMatch).toEqual([[7, 11]]);
    expect(hit?.pathText.slice(7, 11)).toBe('gold');

    const [spare] = run('spare').hits;
    expect(spare?.pathText.slice(...(spare!.pathMatch[0] as [number, number]))).toBe('spare');

    const [value] = run('lic').hits;
    expect(value?.valueMatch).toEqual([[1, 4]]);

    const [mapKey] = run('far').hits;
    expect(mapKey?.pathText.slice(...(mapKey!.pathMatch[0] as [number, number]))).toBe('far');
  });

  it('can match a key and a value of the same node', () => {
    const { hits } = searchState({ gold: 'gold' }, q('gold'), scope());
    expect(hits).toMatchObject([{ pathMatch: [[0, 4]], valueMatch: [[0, 4]] }]);
  });

  it('only searches what the scope allows', () => {
    expect(paths('gold', { statePath: false })).toEqual([]);
    expect(paths('alice', { stateValue: false })).toEqual([]);
    expect(paths('alice', { statePath: false })).toEqual(['player.name']);
    expect(paths('alice', { statePath: false, stateValue: false })).toEqual([]);
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
    expect(run('a').typeCounts).toMatchObject({ string: expect.any(Number) });
    expect(run('gold').typeCounts).toEqual({ number: 1 });
  });

  it('applies whole word and case sensitivity', () => {
    expect(run('alice', {}, { caseSensitive: true }).hits).toEqual([]);
    expect(run('Alic', {}, { wholeWord: true }).hits).toEqual([]);
    expect(run('Alice', {}, { wholeWord: true }).hits).toHaveLength(1);
  });
});
