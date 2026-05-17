const sessionValueCache = new Map<string, unknown>();

export function getPersistedValue<T>(key: string, fallbackValue: T): T {
  return (sessionValueCache.get(key) as T | undefined) ?? fallbackValue;
}

export function setPersistedValue<T>(key: string, value: T): void {
  sessionValueCache.set(key, value);
}
