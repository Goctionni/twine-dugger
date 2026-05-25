/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  baselineMockTwineGameSeed,
  createSugarCubeWindowMock,
} from '@/shared/testing/mock-twine-game';

import { getGameMetaFn } from './getMetaData';

describe('getGameMetaFn', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    window.SugarCube = undefined as unknown as Window['SugarCube'];
  });

  it('should return metadata for mocked SugarCube game', () => {
    const storyData = document.createElement('tw-storydata');
    storyData.setAttribute('creator', baselineMockTwineGameSeed.meta.compiler?.name ?? 'Tweego');
    storyData.setAttribute(
      'creator-version',
      baselineMockTwineGameSeed.meta.compiler?.version ?? '2.1.1',
    );
    storyData.setAttribute(
      'format-version',
      baselineMockTwineGameSeed.meta.format?.version?.shortStr ?? '2.37.3',
    );
    document.body.appendChild(storyData);

    window.SugarCube = createSugarCubeWindowMock();

    const meta = getGameMetaFn();

    if (!meta || '__type' in meta) {
      throw new Error('Expected concrete game metadata');
    }

    expect(meta.name).toBe('Mock SugarCube Story');
    expect(meta.ifId).toBe('MOCK-IFID-001');
    expect(meta.format?.name).toBe('SugarCube');
    expect(meta.format?.version?.shortStr).toBe('2.37.3');
    expect(meta.compiler?.name).toBe('Tweego');
  });
});
