import { beforeEach, describe, expect, it } from 'vite-plus/test';

import sugarcube from './sugarcube';

describe('sugarcube format helper', () => {
  beforeEach(() => {
    (window as any).SugarCube = undefined;
  });

  it('should detect valid SugarCube shape', () => {
    (window as any).SugarCube = { State: { variables: {} } };
    expect(sugarcube.detect()).toBe(true);
  });

  it('should reject invalid SugarCube shape', () => {
    (window as any).SugarCube = { State: {} };
    expect(sugarcube.detect()).toBe(false);
  });

  it('should return sanitized deep-copied state when requested', () => {
    (window as any).SugarCube = {
      State: {
        variables: {
          obj: { x: 1 },
          arr: [{ y: 2 }],
          map: new Map([['k', { z: 3 }]]),
          set: new Set([1, 2]),
        },
      },
    };

    const state = sugarcube.getState(true) as any;
    expect(state).toStrictEqual({
      obj: { x: 1 },
      arr: [{ y: 2 }],
      map: new Map([['k', { z: 3 }]]),
      set: new Set([1, 2]),
    });

    state.obj.x = 99;
    expect((window as any).SugarCube.State.variables.obj.x).toBe(1);
  });

  it('should mutate state via set/delete/duplicate helpers', () => {
    (window as any).SugarCube = {
      State: {
        passage: 'Start',
        variables: { obj: { a: 1 }, arr: [1], map: new Map([['k', 1]]) },
      },
    };

    sugarcube.setState(['obj', 'b'], 2);
    sugarcube.setState(['arr', 1], 2);
    sugarcube.setState(['map', 'k2'], 2);
    sugarcube.duplicateStateProperty(['obj'], 'a', 'a2');
    sugarcube.deleteFromState(['obj', 'a']);

    expect((window as any).SugarCube.State.variables.obj).toStrictEqual({ b: 2, a2: 1 });
    expect((window as any).SugarCube.State.variables.arr).toStrictEqual([1, 2]);
    expect((window as any).SugarCube.State.variables.map.get('k2')).toBe(2);
    expect(sugarcube.getPassage()).toBe('Start');
  });
});
