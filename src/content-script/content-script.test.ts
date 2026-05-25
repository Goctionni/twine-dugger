import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type TestHelper = {
  detect: ReturnType<typeof vi.fn>;
  getDiffer: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  getPassage: ReturnType<typeof vi.fn>;
  processDiffs?: ReturnType<typeof vi.fn>;
  setState: ReturnType<typeof vi.fn>;
  deleteFromState: ReturnType<typeof vi.fn>;
  duplicateStateProperty: ReturnType<typeof vi.fn>;
  setStatePropertyLock: ReturnType<typeof vi.fn>;
  setStatePropertyLocks: ReturnType<typeof vi.fn>;
};

describe('content-script init', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Reflect.deleteProperty(window as any, 'TwineDugger');
  });

  it('should not initialize window runtime when no format helper is detected', async () => {
    const sugarcube = createHelper({ detect: false });
    const harlowe = createHelper({ detect: false });

    await importWithMocks({ sugarcube, harlowe });

    expect((window as any).TwineDugger).toBeUndefined();
  });

  it('should initialize runtime API using the detected helper', async () => {
    const sugarcube = createHelper({ detect: true });
    const harlowe = createHelper({ detect: false });

    const passageData = { current: 'Start' };
    await importWithMocks({ sugarcube, harlowe, passageData });

    const runtime = (window as any).TwineDugger;
    expect(runtime).toBeDefined();

    expect(runtime.getState()).toEqual({
      passage: 'Test Passage',
      state: { mode: 'sanitized' },
    });

    runtime.setState(['a'], 1);
    runtime.deleteFromState(['a']);
    runtime.duplicateStateProperty(['obj'], 'a', 'b');
    runtime.setStatePropertyLock(['obj', 'a'], true);
    runtime.setStatePropertyLocks([['obj', 'a']]);

    expect(sugarcube.setState).toHaveBeenCalledWith(['a'], 1);
    expect(sugarcube.deleteFromState).toHaveBeenCalledWith(['a']);
    expect(sugarcube.duplicateStateProperty).toHaveBeenCalledWith(['obj'], 'a', 'b');
    expect(sugarcube.setStatePropertyLock).toHaveBeenCalledWith(['obj', 'a'], true);
    expect(sugarcube.setStatePropertyLocks).toHaveBeenCalledWith([['obj', 'a']]);
    expect(runtime.getPassageData()).toEqual(passageData);
    expect(typeof runtime.utils.jsonReplacer).toBe('function');
    expect(typeof runtime.utils.jsonReviver).toBe('function');
  });

  it('should return empty updates when differ returns no changes', async () => {
    const sugarcube = createHelper({ detect: true, diffs: [] });
    const harlowe = createHelper({ detect: false });

    await importWithMocks({ sugarcube, harlowe });

    const runtime = (window as any).TwineDugger;
    expect(runtime.getUpdates()).toEqual({ diffPackage: null, locksUpdate: null });
    expect(sugarcube.processDiffs).not.toHaveBeenCalled();
  });

  it('should process and publish diffs and lock updates when changes exist', async () => {
    const diffs = [{ op: 'UPDATE', path: ['player', 'hp'], oldValue: 1, value: 2 }];
    const locksUpdate = [['player', 'hp']];

    const sugarcube = createHelper({ detect: true, diffs, processResult: { diffs, locksUpdate } });
    const harlowe = createHelper({ detect: false });

    await importWithMocks({ sugarcube, harlowe });

    const runtime = (window as any).TwineDugger;
    expect(runtime.getUpdates()).toEqual({
      diffPackage: {
        passage: 'Test Passage',
        diffs,
      },
      locksUpdate,
    });
    expect(sugarcube.processDiffs).toHaveBeenCalledWith(diffs);
  });
});

function createHelper(options: {
  detect: boolean;
  diffs?: unknown[];
  processResult?: { diffs: unknown[]; locksUpdate: unknown };
}): TestHelper {
  const diffs = options.diffs ?? [];
  const differ = vi.fn(() => diffs);

  const helper: TestHelper = {
    detect: vi.fn(() => options.detect),
    getDiffer: vi.fn(() => differ),
    getState: vi.fn((sanitized: boolean) => (sanitized ? { mode: 'sanitized' } : { mode: 'raw' })),
    getPassage: vi.fn(() => 'Test Passage'),
    processDiffs: vi.fn(
      (incomingDiffs: unknown[]) =>
        options.processResult ?? { diffs: incomingDiffs, locksUpdate: null },
    ),
    setState: vi.fn(),
    deleteFromState: vi.fn(),
    duplicateStateProperty: vi.fn(),
    setStatePropertyLock: vi.fn(),
    setStatePropertyLocks: vi.fn(),
  };

  return helper;
}

async function importWithMocks(options: {
  sugarcube: TestHelper;
  harlowe: TestHelper;
  passageData?: unknown;
}) {
  vi.doMock('@/shared/copy', () => ({
    copy: vi.fn((value: unknown) => structuredClone(value)),
  }));

  vi.doMock('./format-helpers/sugarcube', () => ({
    default: options.sugarcube,
  }));

  vi.doMock('./format-helpers/harlowe', () => ({
    default: options.harlowe,
  }));

  vi.doMock('./format-helpers/shared', () => ({
    getPassageData: vi.fn(() => options.passageData ?? { passage: 'default' }),
  }));

  await import('./content-script');
}
