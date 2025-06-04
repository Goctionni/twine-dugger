const COMMON_ID_KEYS = ['id', '_id', '__id', 'key', 'uuid', '_uuid', '__uuid'] as const;

export function getPotentialId(obj: unknown) {
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
      return value;
    }
  }
  return undefined;
}
