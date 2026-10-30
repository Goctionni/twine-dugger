import { afterEach, expect, it, vi } from 'vite-plus/test';

import { deleteFromState, setState, setStateMulti } from './api';
import { executeCode } from './remote-execute';

vi.mock('./remote-execute', () => ({
  executeCode: vi.fn(),
  injectContentScript: vi.fn(async () => {}),
}));
vi.mock('./remote-functions/getMetaData', () => ({ getGameMetaFn: vi.fn() }));

afterEach(() => {
  vi.mocked(executeCode).mockReset();
  vi.restoreAllMocks();
});

it('sends the writes in one call and returns what came back', async () => {
  vi.mocked(executeCode).mockResolvedValue([{ ok: true }, { ok: true }]);
  const writes = [
    { path: ['a'], value: 1 },
    { path: ['b'], delete: true as const },
  ];

  expect(await setStateMulti(writes)).toEqual([{ ok: true }, { ok: true }]);
  expect(executeCode).toHaveBeenCalledTimes(1);
  expect(vi.mocked(executeCode).mock.calls[0]![1]!.args).toEqual(['setStateMulti', writes]);
});

it('logs a write that failed, and says all failed when the call did not get through', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(executeCode).mockResolvedValueOnce([{ ok: true }, { ok: false, error: 'No parent' }]);
  await setStateMulti([
    { path: ['a'], value: 1 },
    { path: ['x', 'y'], value: 2 },
  ]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0]![2]).toBe('No parent');

  vi.mocked(executeCode).mockResolvedValueOnce(null);
  const results = await setStateMulti([{ path: ['a'], value: 1 }]);
  expect(results).toEqual([{ ok: false, error: 'The call to the page failed' }]);
});

it('writes one value or deletes one through the same call', async () => {
  vi.mocked(executeCode).mockResolvedValue([{ ok: true }]);

  await setState(['a', 'b'], { m: 1 }, { deep: true });
  expect(vi.mocked(executeCode).mock.calls[0]![1]!.args).toEqual([
    'setStateMulti',
    [{ path: ['a', 'b'], value: { m: 1 }, deep: true }],
  ]);

  await deleteFromState(['a', 'b']);
  expect(vi.mocked(executeCode).mock.calls[1]![1]!.args).toEqual([
    'setStateMulti',
    [{ path: ['a', 'b'], delete: true }],
  ]);
});
