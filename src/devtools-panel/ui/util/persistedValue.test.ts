import { describe, expect, it } from 'vite-plus/test';

import { getPersistedValue, setPersistedValue } from './persistedValue';

describe('persistedValue', () => {
  it('should return fallback when key has no persisted value', () => {
    expect(getPersistedValue('missing-key-1', 'fallback')).toBe('fallback');
  });

  it('should return persisted value after set', () => {
    setPersistedValue('persisted-key-1', { enabled: true });

    expect(getPersistedValue('persisted-key-1', { enabled: false })).toEqual({ enabled: true });
  });

  it('should keep keys isolated by key name', () => {
    setPersistedValue('persisted-key-2', 42);

    expect(getPersistedValue('persisted-key-2', 0)).toBe(42);
    expect(getPersistedValue('persisted-key-3', 0)).toBe(0);
  });
});
