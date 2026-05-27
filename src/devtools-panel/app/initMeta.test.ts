import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type AnyFn = (...args: any[]) => any;

const {
  getGameMetaDataMock,
  setCandidateIframesMock,
  setConnectionStateMock,
  setGameMetaDataMock,
} = vi.hoisted(() => ({
  getGameMetaDataMock: vi.fn<AnyFn>(),
  setCandidateIframesMock: vi.fn<AnyFn>(),
  setConnectionStateMock: vi.fn<AnyFn>(),
  setGameMetaDataMock: vi.fn<AnyFn>(),
}));

vi.mock('../api/api', () => ({
  getGameMetaData: getGameMetaDataMock,
}));

vi.mock('../store', () => ({
  setCandidateIframes: setCandidateIframesMock,
  setConnectionState: setConnectionStateMock,
  setGameMetaData: setGameMetaDataMock,
}));

import { initMeta } from './initMeta';

describe('initMeta', () => {
  beforeEach(() => {
    getGameMetaDataMock.mockReset();
    setCandidateIframesMock.mockReset();
    setConnectionStateMock.mockReset();
    setGameMetaDataMock.mockReset();
  });

  it('should set no-game state and return false when metadata is missing', async () => {
    getGameMetaDataMock.mockResolvedValue(null);

    const result = await initMeta();

    expect(result).toBe(false);
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(1, 'loading-meta');
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(2, 'no-game-detected');
    expect(setCandidateIframesMock.mock.calls).toStrictEqual([]);
    expect(setGameMetaDataMock.mock.calls).toStrictEqual([]);
  });

  it('should set candidate iframe state and return false for candidate metadata', async () => {
    getGameMetaDataMock.mockResolvedValue({
      __type: 'candidate-game-iframes',
      urls: ['https://example.test/game'],
    });

    const result = await initMeta();

    expect(result).toBe(false);
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(1, 'loading-meta');
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(2, 'candidate-iframes');
    expect(setCandidateIframesMock).toHaveBeenCalledWith(['https://example.test/game']);
    expect(setGameMetaDataMock.mock.calls).toStrictEqual([]);
  });

  it('should persist game metadata and return true for supported game', async () => {
    const meta = {
      name: 'Demo',
      ifId: 'ifid-1',
    };
    getGameMetaDataMock.mockResolvedValue(meta);

    const result = await initMeta();

    expect(result).toBe(true);
    expect(setGameMetaDataMock).toHaveBeenCalledWith(meta);
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(1, 'loading-meta');
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(2, 'not-enabled');
  });

  it('should treat non-candidate __type payload as normal metadata', async () => {
    const meta = {
      __type: 'not-candidate',
      name: 'Demo',
      ifId: 'ifid-2',
    };
    getGameMetaDataMock.mockResolvedValue(meta);

    const result = await initMeta();

    expect(result).toBe(true);
    expect(setGameMetaDataMock).toHaveBeenCalledWith(meta);
    expect(setCandidateIframesMock.mock.calls).toStrictEqual([]);
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(2, 'not-enabled');
  });

  it('should set error state and rethrow when metadata fetch fails', async () => {
    const error = new Error('metadata failed');
    getGameMetaDataMock.mockRejectedValue(error);

    await expect(initMeta()).rejects.toThrow('metadata failed');
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(1, 'loading-meta');
    expect(setConnectionStateMock).toHaveBeenNthCalledWith(2, 'error');
  });
});
