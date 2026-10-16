import { createSignal } from 'solid-js';

const sessionValueCache = new Map<string, unknown>();

export function getPersistedValue<T>(key: string, fallbackValue: T): T {
  return (sessionValueCache.get(key) as T | undefined) ?? fallbackValue;
}

export function setPersistedValue<T>(key: string, value: T): void {
  sessionValueCache.set(key, value);
}

export function createPersistedSignal<T>(key: string | undefined, fallbackValue: T) {
  const initialValue = key ? getPersistedValue(key, fallbackValue) : fallbackValue;
  const [getValue, setValue] = createSignal<T>(initialValue as Exclude<T, Function>);
  const setPersistedSignal = (value: T) => {
    setValue(() => value);
    if (key) setPersistedValue(key, value);
  };
  return [getValue, setPersistedSignal] as const;
}
