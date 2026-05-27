/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  deleteFromState,
  duplicateStateProperty,
  getPassageData,
  getStateValue,
  setState,
} from './shared';

describe('format-helpers/shared', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should resolve nested values from object, map, and array paths', () => {
    const state = {
      player: {
        stats: new Map<string, unknown>([['hp', [10, 20]]]),
      },
    } as any;

    expect(getStateValue(state, ['player', 'stats', 'hp', 1])).toBe(20);
  });

  it('should return null and log when path cannot be resolved', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const value = getStateValue(7 as any, ['bad']);

    expect(value).toBeNull();
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should duplicate properties for array, map, and object containers', () => {
    const state = {
      arr: [1, { x: 2 }],
      map: new Map<string, unknown>([['a', { y: 3 }]]),
      obj: { a: { z: 4 } },
    } as any;

    duplicateStateProperty(state, ['arr'], 1);
    duplicateStateProperty(state, ['map'], 'a', 'b');
    duplicateStateProperty(state, ['obj'], 'a', 'b');

    expect(state.arr).toHaveLength(3);
    expect(state.arr[2]).toStrictEqual({ x: 2 });
    expect(state.arr[2]).not.toBe(state.arr[1]);

    expect(state.map.get('b')).toStrictEqual({ y: 3 });
    expect(state.map.get('b')).not.toBe(state.map.get('a'));

    expect(state.obj.b).toStrictEqual({ z: 4 });
    expect(state.obj.b).not.toBe(state.obj.a);
  });

  it('should log and abort duplicate when parent missing or target key missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    duplicateStateProperty({} as any, ['missing'], 'a');
    duplicateStateProperty({ obj: { a: 1 } }, ['obj'], 'a');

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('should set values for array, map, and object targets', () => {
    const state = {
      arr: [1, 2],
      map: new Map<string, unknown>(),
      obj: { a: 1 },
    } as any;

    setState(state, ['arr', 1], 22);
    setState(state, ['map', 'k'], 'v');
    setState(state, ['obj', 'a'], 11);

    expect(state.arr[1]).toBe(22);
    expect(state.map.get('k')).toBe('v');
    expect(state.obj.a).toBe(11);
  });

  it('should delete values for array, map, and object targets', () => {
    const state = {
      arr: [1, 2, 3],
      map: new Map<string, unknown>([['k', 1]]),
      obj: { a: 1, b: 2 },
    };

    deleteFromState(state as any, ['arr', 1]);
    deleteFromState(state as any, ['map', 'k']);
    deleteFromState(state as any, ['obj', 'a']);

    expect(state.arr).toStrictEqual([1, 3]);
    expect(state.map.has('k')).toBe(false);
    expect(state.obj).toStrictEqual({ b: 2 });
  });

  it('should log when delete target parent is not deletable object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    deleteFromState({ bad: 123 as any }, ['bad', 'x']);

    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should extract passage data from tw-storydata DOM nodes', () => {
    document.body.innerHTML = `
      <tw-storydata>
        <tw-passagedata pid="1" name="Start" tags="intro">Hello</tw-passagedata>
        <tw-passagedata pid="2" name="Forest">World</tw-passagedata>
      </tw-storydata>
    `;

    const passages = getPassageData();

    expect(passages).toHaveLength(2);
    expect(passages[0]).toMatchObject({ pid: '1', name: 'Start', tags: 'intro' });
    expect(passages[1]).toMatchObject({ pid: '2', name: 'Forest' });
  });
});
