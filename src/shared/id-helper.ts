import type { JSONSafeArray, JSONSafeObject } from './shared-types';

const COMMON_ID_KEYS = ['id', '_id', '__id', 'key', 'uuid', '_uuid', '__uuid', 'name'] as const;

/** An id the object has itself, in one of the properties that ids are commonly kept in */
export function getObjectId(obj: unknown) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;

  for (const key of COMMON_ID_KEYS) {
    const value = (obj as Record<string, unknown>)[key];
    const isPrimitiveId = ['string', 'number', 'boolean'].includes(typeof value);
    if (isPrimitiveId && value !== '') return `$$id:${key}:${String(value)}`;
  }
  return undefined;
}

export type IdentityCache = Map<object, JSONSafeArray | JSONSafeObject>;
export type IdentityLookup = Map<JSONSafeArray | JSONSafeObject, object>;

/**
 * Gives an object the same hash on both sides of a diff when its live counterpart exists in both
 * the old and the new state. That is what lets jsondiffpatch match array items by reference.
 */
export function setupIdentityHasher() {
  let hashIndex = 0;
  let oldLookup: IdentityLookup = new Map();
  let newLookup: IdentityLookup = new Map();
  let oldLive = new Set<object>();
  let newLive = new Set<object>();
  const hashes = new Map<object, string>();

  return {
    getObjectHash(transformedObject: object) {
      const key = transformedObject as JSONSafeArray | JSONSafeObject;
      const live = oldLookup.get(key) ?? newLookup.get(key);
      if (!live || !oldLive.has(live) || !newLive.has(live)) return undefined;

      let hash = hashes.get(live);
      if (!hash) {
        hash = `$$ref:${(hashIndex++).toString(36)}`;
        hashes.set(live, hash);
      }
      return hash;
    },
    setIdentitySources(sources: {
      oldIdentityLookup: IdentityLookup;
      newIdentityLookup: IdentityLookup;
    }) {
      oldLookup = sources.oldIdentityLookup;
      newLookup = sources.newIdentityLookup;
      oldLive = new Set(oldLookup.values());
      newLive = new Set(newLookup.values());
      hashes.clear();
    },
  };
}
