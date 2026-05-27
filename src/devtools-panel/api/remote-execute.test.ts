import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { executeCode, injectContentScript } from './remote-execute';

describe('remote-execute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute callback in inspected tab and return first result', async () => {
    const executeScript = vi.fn<(...args: any[]) => any>().mockResolvedValue([{ result: 123 }]);
    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 77 } },
      scripting: { executeScript },
    });

    const result = await executeCode((a: unknown, b: unknown) => Number(a) + Number(b), {
      args: [1, 2],
    });

    expect(result).toBe(123);
    const payload = executeScript.mock.calls[0]?.[0] as {
      target: { tabId: number };
      world: string;
      args: unknown[];
    };
    expect(payload.target).toStrictEqual({ tabId: 77 });
    expect(payload.world).toBe('MAIN');
    expect(payload.args).toStrictEqual([1, 2]);
  });

  it('should return null when executeScript throws', async () => {
    const executeScript = vi.fn<(...args: any[]) => any>().mockRejectedValue(new Error('bad'));
    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 77 } },
      scripting: { executeScript },
    });

    const result = await executeCode(() => 1);
    expect(result).toBeNull();
  });

  it('should inject content script only when not already injected', async () => {
    const executeScript = vi
      .fn<(...args: any[]) => any>()
      .mockResolvedValueOnce([{ result: false }])
      .mockResolvedValueOnce([{ result: undefined }]);

    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 9 } },
      scripting: { executeScript },
    });

    await injectContentScript();

    const first = executeScript.mock.calls[0]?.[0] as { world: string; func: unknown };
    const second = executeScript.mock.calls[1]?.[0] as { world: string; files: string[] };
    expect(first.world).toBe('MAIN');
    expect(typeof first.func).toBe('function');
    expect(second.world).toBe('MAIN');
    expect(second.files).toStrictEqual(['content-script.js']);
  });

  it('should skip content-script injection when already present', async () => {
    const executeScript = vi.fn<(...args: any[]) => any>().mockResolvedValue([{ result: true }]);

    vi.stubGlobal('chrome', {
      devtools: { inspectedWindow: { tabId: 9 } },
      scripting: { executeScript },
    });

    await injectContentScript();
    expect(executeScript).toHaveBeenCalledTimes(1);
  });
});
