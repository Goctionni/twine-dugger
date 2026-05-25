import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { executeCode, injectContentScript } from './remote-execute';

describe('remote-execute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute callback in inspected tab and return first result', async () => {
    const executeScript = vi.fn().mockResolvedValue([{ result: 123 }]);
    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 77 } },
      scripting: { executeScript },
    });

    const result = await executeCode((a: unknown, b: unknown) => Number(a) + Number(b), {
      args: [1, 2],
    });

    expect(result).toBe(123);
    expect(executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 77 },
        world: 'MAIN',
        args: [1, 2],
      }),
    );
  });

  it('should return null when executeScript throws', async () => {
    const executeScript = vi.fn().mockRejectedValue(new Error('bad'));
    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 77 } },
      scripting: { executeScript },
    });

    const result = await executeCode(() => 1);
    expect(result).toBeNull();
  });

  it('should inject content script only when not already injected', async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ result: false }])
      .mockResolvedValueOnce([{ result: undefined }]);

    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 9 } },
      scripting: { executeScript },
    });

    await injectContentScript();

    expect(executeScript).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        world: 'MAIN',
        func: expect.any(Function),
      }),
    );
    expect(executeScript).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        world: 'MAIN',
        files: ['content-script.js'],
      }),
    );
  });

  it('should skip content-script injection when already present', async () => {
    const executeScript = vi.fn().mockResolvedValue([{ result: true }]);

    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 9 } },
      scripting: { executeScript },
    });

    await injectContentScript();
    expect(executeScript).toHaveBeenCalledTimes(1);
  });
});
