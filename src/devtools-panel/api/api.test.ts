import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('./remote-execute', () => ({
  executeCode: vi.fn<(...args: any[]) => any>(),
  injectContentScript: vi.fn<(...args: any[]) => any>(),
}));

vi.mock('./remote-functions/getMetaData', () => ({
  getGameMetaFn: vi.fn<(...args: any[]) => any>(() => ({ name: 'meta' })),
}));

import {
  deleteFromState,
  duplicateStateProperty,
  getGameMetaData,
  getPassageData,
  getState,
  getUpdates,
  setState,
  setStatePropertyLock,
  setStatePropertyLocks,
} from './api';
import { executeCode, injectContentScript } from './remote-execute';
import { getGameMetaFn } from './remote-functions/getMetaData';

const executeCodeMock = vi.mocked(executeCode);
const injectContentScriptMock = vi.mocked(injectContentScript);

describe('api bridge wrappers', () => {
  beforeEach(() => {
    executeCodeMock.mockReset();
    injectContentScriptMock.mockReset();
  });

  it('should forward getGameMetaData callback to executeCode', async () => {
    executeCodeMock.mockResolvedValueOnce({ ok: true } as never);

    await getGameMetaData();

    expect(executeCodeMock).toHaveBeenCalledWith(getGameMetaFn);
  });

  it('should inject and parse JSON in getState/getUpdates when response is string', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock
      .mockResolvedValueOnce(JSON.stringify({ state: { a: 1 } }) as never)
      .mockResolvedValueOnce(JSON.stringify({ diffPackage: null, locksUpdate: null }) as never);

    const state = await getState();
    const updates = await getUpdates();

    expect(injectContentScriptMock).toHaveBeenCalledTimes(2);
    expect(state).toStrictEqual({ state: { a: 1 } });
    expect(updates).toStrictEqual({ diffPackage: null, locksUpdate: null });
  });

  it('should return raw getState/getUpdates value when executeCode does not return string', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock.mockResolvedValueOnce(null as never).mockResolvedValueOnce(undefined as never);

    expect(await getState()).toBeNull();
    expect(await getUpdates()).toBeUndefined();
  });

  it('should return null from getState/getUpdates callback when TwineDugger is missing', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock.mockImplementation(async (cb: any) => cb());

    Reflect.deleteProperty(window as any, 'TwineDugger');

    expect(await getState()).toBeNull();
    expect(await getUpdates()).toBeNull();
  });

  it('should execute TwineDugger function from dispatched callback when runtime is present', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock.mockResolvedValue(undefined as never);

    const setStateFn = vi.fn<(...args: any[]) => any>();
    (window as any).TwineDugger = {
      setState: setStateFn,
      utils: {},
    };

    await setState(['player', 'hp'], 10);

    const callback = executeCodeMock.mock.calls[0]?.[0] as any;
    callback('setState', ['player', 'hp'], 10);

    expect(setStateFn).toHaveBeenCalledWith(['player', 'hp'], 10);
  });

  it('should dispatch TwineDugger mutator wrappers with cloned path arguments', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock.mockResolvedValue(undefined as never);

    const path = ['player', 'hp'] as Array<string | number>;
    await setState(path, 10);
    await setStatePropertyLock(path, true);
    await setStatePropertyLocks([path]);
    await duplicateStateProperty(['player'], 'hp', 'hp2');
    await deleteFromState(path);
    await getPassageData();

    expect(injectContentScriptMock).toHaveBeenCalledTimes(6);
    expect(executeCodeMock).toHaveBeenCalledTimes(6);

    const [setStateCall] = executeCodeMock.mock.calls;
    expect(setStateCall?.[1]).toStrictEqual({
      args: ['setState', ['player', 'hp'], 10],
      requires: ['content-script.js'],
    });

    const [setLockCall] = executeCodeMock.mock.calls.slice(1);
    expect(setLockCall?.[1]).toStrictEqual({
      args: ['setStatePropertyLock', ['player', 'hp'], true],
      requires: ['content-script.js'],
    });

    const [setLocksCall] = executeCodeMock.mock.calls.slice(2);
    expect(setLocksCall?.[1]).toStrictEqual({
      args: ['setStatePropertyLocks', [['player', 'hp']]],
      requires: ['content-script.js'],
    });

    const [dupCall] = executeCodeMock.mock.calls.slice(3);
    expect(dupCall?.[1]).toStrictEqual({
      args: ['duplicateStateProperty', ['player'], 'hp', 'hp2'],
      requires: ['content-script.js'],
    });

    const [deleteCall] = executeCodeMock.mock.calls.slice(4);
    expect(deleteCall?.[1]).toStrictEqual({
      args: ['deleteFromState', ['player', 'hp']],
      requires: ['content-script.js'],
    });

    const [passageCall] = executeCodeMock.mock.calls.slice(5);
    expect(passageCall?.[1]).toStrictEqual({
      args: ['getPassageData'],
      requires: ['content-script.js'],
    });
  });

  it('should return undefined from exec callback when TwineDugger runtime is missing', async () => {
    injectContentScriptMock.mockResolvedValue(undefined);
    executeCodeMock.mockResolvedValue(undefined as never);

    await setState(['x'], 1);

    const callback = executeCodeMock.mock.calls[0]?.[0] as any;
    Reflect.deleteProperty(window as any, 'TwineDugger');

    expect(callback('setState', ['x'], 1)).toBeUndefined();
  });
});
