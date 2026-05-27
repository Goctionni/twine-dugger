import { describe, expect, it } from 'vite-plus/test';

import { getLockStatus } from './lock-helper';

describe('getLockStatus', () => {
  it('should return locked when path exactly matches a locked path', () => {
    expect(
      getLockStatus(
        () => ['player', 'hp'],
        () => [['player', 'hp'], ['other']],
      ),
    ).toBe('locked');
  });

  it('should return ancestor-lock when a parent path is locked', () => {
    expect(
      getLockStatus(
        () => ['player', 'stats', 'hp'],
        () => [['player', 'stats']],
      ),
    ).toBe('ancestor-lock');
  });

  it('should return unlocked when no matching lock exists', () => {
    expect(
      getLockStatus(
        () => ['player', 'mana'],
        () => [['player', 'hp']],
      ),
    ).toBe('unlocked');
  });
});
