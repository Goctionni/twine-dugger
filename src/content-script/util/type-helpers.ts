export function isObj(value: unknown): value is object {
  return !!value && typeof value === 'object';
}
