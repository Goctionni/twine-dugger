import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { GameMetaData } from '@/shared/shared-types';

import { getGameMetaFn } from './getMetaData';

const win = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete win.XLowe;
  document.body.innerHTML = '';
  document.title = '';
});

const getMeta = () => getGameMetaFn() as GameMetaData;

describe('getGameMetaFn for XLowe', () => {
  it('takes what it needs from the XLowe globals when there is no tw-storydata', () => {
    document.title = 'Page title';
    win.XLowe = {
      story: { ifid: 'ABC-123', name: 'The Game' },
      framework: { major: 1, minor: 2, patch: 3, semantic: '1.2.3-beta' },
      engine: { major: 3, minor: 3, patch: 9 },
    };

    const meta = getMeta();
    expect(meta.ifId).toBe('ABC-123');
    expect(meta.name).toBe('The Game');
    expect(meta.format).toEqual({
      name: 'Harlowe',
      version: { major: 3, minor: 3, patch: 9, shortStr: '3.3.9' },
    });
    expect(meta.framework).toEqual({
      name: 'XLowe',
      version: { major: 1, minor: 2, patch: 3, shortStr: '1.2.3-beta' },
    });
  });

  it('prefers the tw-storydata of the page when there is one', () => {
    document.body.innerHTML =
      '<tw-storydata name="From data" ifid="DATA-1" format="Harlowe"></tw-storydata>';
    win.XLowe = { story: { ifid: 'ABC-123', name: 'The Game' } };

    const meta = getMeta();
    expect(meta.ifId).toBe('DATA-1');
    expect(meta.name).toBe('From data');
  });

  it('copes with missing or malformed properties', () => {
    document.title = 'Page title';
    for (const xlowe of [
      {},
      { story: null },
      { story: { ifid: 5, name: '' } },
      { framework: 'v1', engine: { major: 'x' } },
      { framework: { major: 1, minor: 2 } },
    ]) {
      win.XLowe = xlowe;
      const meta = getMeta();
      expect(meta.ifId).toBe('');
      expect(meta.name).toBe('Page title');
      expect(meta.framework).toBeUndefined();
      expect(meta.format?.version).toBeUndefined();
    }
  });
});
