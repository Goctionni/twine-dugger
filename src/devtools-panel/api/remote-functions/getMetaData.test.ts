import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { GameMetaData } from '@/shared/shared-types';

import { getGameMetaFn } from './getMetaData';

const win = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete win.XLowe;
  delete win.SugarCube;
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

describe('getGameMetaFn for a SugarCube game that has blocked access to its API', () => {
  const blocked = { __type: 'blocked-api', format: 'SugarCube' };

  it('says so for a page that has the script of SugarCube, and no SugarCube', () => {
    document.body.innerHTML = '<script id="script-sugarcube"></script>';
    expect(getGameMetaFn()).toEqual(blocked);
  });

  it('says so for a page that has the elements of the SugarCube page', () => {
    document.body.innerHTML =
      '<div id="ui-bar"></div><div id="story"><div id="passages"></div></div>';
    expect(getGameMetaFn()).toEqual(blocked);
  });

  it('is not for a page that has only one of those elements', () => {
    document.body.innerHTML = '<div id="passages"></div>';
    expect(getGameMetaFn()).toBeNull();
    document.body.innerHTML = '<div id="ui-bar"></div>';
    expect(getGameMetaFn()).toBeNull();
  });

  it('is not for a page of another format, which is found first', () => {
    document.body.innerHTML = '<script id="script-sugarcube"></script>';
    win.XLowe = { story: { ifid: 'ABC-123', name: 'The Game' } };
    expect(getMeta().format?.name).toBe('Harlowe');
  });

  it('gives way to a page that does have SugarCube', () => {
    document.body.innerHTML = '<script id="script-sugarcube"></script>';
    win.SugarCube = {
      Config: { passages: {}, history: { controls: true, maxStates: 100 }, saves: {} },
      Save: { slots: { length: 8, count: () => 2 } },
      State: { variables: {}, passage: 'Start' },
      Story: { ifId: 'IF-1', has: () => true, get: () => ({}), name: 'The Game' },
      storage: {},
      version: {
        major: 2,
        minor: 36,
        patch: 1,
        build: 1,
        long: () => 'v2.36.1',
        short: () => '2.36.1',
      },
    };
    expect(getMeta().ifId).toBe('IF-1');
  });
});
