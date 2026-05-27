import { describe, expect, it } from 'vite-plus/test';

import {
  baselineMockTwineGameSeed,
  cloneMockTwineGameSeed,
  createLargeTopLevelSeed,
  createMockTwineGameSeed,
  createSugarCubeWindowMock,
} from './mock-twine-game';

describe('mock-twine-game helpers', () => {
  it('should clone baseline seed without mutating source', () => {
    const cloned = cloneMockTwineGameSeed();
    cloned.state.player = { name: 'Changed' } as any;

    expect((baselineMockTwineGameSeed.state.player as any).name).toBe('Avery');
  });

  it('should merge top-level state patches into created seed', () => {
    const seed = createMockTwineGameSeed({ initialPassage: 'Forest' }, { coins: 12 });

    expect(seed.initialPassage).toBe('Forest');
    expect(seed.state.coins).toBe(12);
    expect(seed.state.player).toBeTruthy();
  });

  it('should create large top-level state with requested key count', () => {
    const seed = createLargeTopLevelSeed(3);

    expect(seed.state.var_001).toBe(0);
    expect(seed.state.var_002).toBe(1);
    expect(seed.state.var_003).toBe(2);
  });

  it('should build sugarcube window mock values from seed metadata', () => {
    const mockWindow = createSugarCubeWindowMock();

    expect(mockWindow.Story.name).toBe('Mock SugarCube Story');
    expect(mockWindow.Config.passages.start).toBe('Start');
    expect(mockWindow.Save.browser.slot.size).toBe(2);
    expect(mockWindow.version.short()).toBe('2.37.3');
  });
});
