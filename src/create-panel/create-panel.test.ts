// @ts-nocheck

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

describe('create-panel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should create devtools panel and register onShown listener', () => {
    const addListener = vi.fn();
    const create = vi.fn((_title, _icon, _page, callback) => {
      callback({
        onShown: {
          addListener,
        },
      } as never);
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('chrome', {
      devtools: {
        panels: {
          create,
        },
      },
    });

    const filePath = path.resolve(__dirname, 'create-panel.ts');
    const script = fs.readFileSync(filePath, 'utf8');
    vm.runInNewContext(script, { chrome: (globalThis as any).chrome, console });

    expect(create).toHaveBeenCalledWith('Twine Dugger', '', './index.html', expect.any(Function));
    expect(addListener).toHaveBeenCalledTimes(1);

    const onShown = addListener.mock.calls[0]![0] as (window: string) => void;
    onShown('devtools-window');

    expect(logSpy).toHaveBeenCalledWith('DevTools panel created.');
    expect(logSpy).toHaveBeenCalledWith('Panel shown. Window:', 'devtools-window');
  });
});
