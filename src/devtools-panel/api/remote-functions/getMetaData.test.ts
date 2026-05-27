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
    Reflect.deleteProperty(window as any, 'SugarCube');
    Reflect.deleteProperty(window as any, 'Harlowe');
  });

  it('should return metadata for mocked SugarCube game', () => {
    const storyData = document.createElement('tw-storydata');
    storyData.setAttribute('creator', baselineMockTwineGameSeed.meta.compiler.name);
    storyData.setAttribute('creator-version', baselineMockTwineGameSeed.meta.compiler.version);
    storyData.setAttribute(
      'format-version',
      baselineMockTwineGameSeed.meta.format.version.shortStr,
    );
    document.body.appendChild(storyData);

    window.SugarCube = createSugarCubeWindowMock();

    const meta = getGameMetaFn();
    expect(meta).toBeTruthy();
    expect(meta).not.toHaveProperty('__type');

    const concreteMeta = meta as Exclude<
      ReturnType<typeof getGameMetaFn>,
      null | { __type: 'candidate-game-iframes'; urls: string[] }
    >;

    expect(concreteMeta.name).toBe('Mock SugarCube Story');
    expect(concreteMeta.ifId).toBe('MOCK-IFID-001');
    expect(concreteMeta.format?.name).toBe('SugarCube');
    expect(concreteMeta.format?.version?.shortStr).toBe('2.37.3');
    expect(concreteMeta.compiler?.name).toBe('Tweego');
  });

  it('should return metadata for detected Harlowe story', () => {
    const storyData = document.createElement('tw-storydata');
    storyData.setAttribute('name', 'Harlowe Story');
    storyData.setAttribute('ifid', 'HARLOWE-IFID');
    storyData.setAttribute('format-version', '3.2.1');
    storyData.setAttribute('creator', 'Twine');
    storyData.setAttribute('creator-version', '2.10.0');
    storyData.setAttribute('startnode', '2');

    const p1 = document.createElement('tw-passagedata');
    p1.setAttribute('pid', '1');
    p1.setAttribute('name', 'Intro');

    const p2 = document.createElement('tw-passagedata');
    p2.setAttribute('pid', '2');
    p2.setAttribute('name', 'Start');

    document.body.append(storyData, p1, p2);
    (window as any).Harlowe = {};

    const meta = getGameMetaFn();
    expect(meta).toBeTruthy();
    expect(meta).not.toHaveProperty('__type');

    const concreteMeta = meta as Exclude<
      ReturnType<typeof getGameMetaFn>,
      null | { __type: 'candidate-game-iframes'; urls: string[] }
    >;

    expect(concreteMeta.name).toBe('Harlowe Story');
    expect(concreteMeta.ifId).toBe('HARLOWE-IFID');
    expect(concreteMeta.format?.name).toBe('Harlowe');
    expect(concreteMeta.format?.version?.shortStr).toBe('3.2.1');
    expect(concreteMeta.passages).toStrictEqual({ start: 'Start', count: 2 });
    expect(concreteMeta.compiler).toStrictEqual({ name: 'Twine', version: '2.10.0' });
  });

  it('should return candidate iframe urls when no format is detected', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://example.test/game.html');
    iframe.getBoundingClientRect = () =>
      ({
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
      }) as DOMRect;

    document.body.appendChild(iframe);
    Reflect.deleteProperty(window as any, 'SugarCube');
    Reflect.deleteProperty(window as any, 'Harlowe');

    const meta = getGameMetaFn();

    expect(meta).toStrictEqual({
      __type: 'candidate-game-iframes',
      urls: ['https://example.test/game.html'],
    });
  });

  it('should return null when no format and no candidate iframe is found', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://example.test/small.html');
    iframe.getBoundingClientRect = () =>
      ({
        width: 10,
        height: 10,
        left: 0,
        top: 0,
        right: 10,
        bottom: 10,
      }) as DOMRect;
    document.body.appendChild(iframe);

    expect(getGameMetaFn()).toBeNull();
  });
});
