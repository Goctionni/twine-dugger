import type { JSONSafeArray, JSONSafeObject } from './shared-types';

const COMMON_ID_KEYS = ['id', '_id', '__id', 'key', 'uuid', '_uuid', '__uuid', 'name'] as const;

export function getObjectId(obj: unknown) {
  if (Array.isArray(obj)) return undefined;
  if (obj instanceof Set) return undefined;
  if (!obj || typeof obj !== 'object') return undefined;

  const objKeys = obj instanceof Map ? [...obj.keys()] : Object.keys(obj);
  for (const key of COMMON_ID_KEYS) {
    if (objKeys.includes(key)) {
      const value = obj instanceof Map ? obj.get(key) : obj[key as keyof typeof obj];
      if (value === null || value === undefined || value === '') continue;
      if (typeof value === 'object') continue;
      if (typeof value === 'function') continue;
      return `$$id:${key}:${value}`;
    }
  }
  return undefined;
}

export type IdentityCache = Map<object, JSONSafeArray | JSONSafeObject>;
export type IdentityLookup = Map<JSONSafeArray | JSONSafeObject, object>;

interface DiffSources {
  left: IdentityLookup;
  right: IdentityCache;
  hashes: Map<unknown, string>;
}

export function setupIdentityHasher() {
  let hashIndex = 0;
  const diffSources: DiffSources = {
    left: new Map(),
    right: new Map(),
    hashes: new Map(),
  };

  return {
    getObjectHash(transformedObject: object) {
      const item = diffSources.left.get(transformedObject as JSONSafeArray | JSONSafeObject);
      if (!item || !diffSources.right.has(item)) return undefined;

      if (!diffSources.hashes.has(item)) {
        const hash = `$$ref:${(hashIndex++).toString(36)}`;
        diffSources.hashes.set(item, hash);
      }
      return diffSources.hashes.get(item)!;
    },
    setIdentitySources({
      oldIdentityLookup,
      newIdentityCache,
    }: {
      oldIdentityLookup: IdentityLookup;
      newIdentityCache: IdentityCache;
    }) {
      diffSources.left = oldIdentityLookup;
      diffSources.right = newIdentityCache;
      diffSources.hashes.clear();
    },
  };
}
