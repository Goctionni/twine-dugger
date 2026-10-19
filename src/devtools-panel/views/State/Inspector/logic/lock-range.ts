export interface LockRange {
  min: number;
  max: number;
}

/** One bound changes; the other is pushed along when the new one would cross it */
export function changeBound(range: LockRange, bound: keyof LockRange, value: number): LockRange {
  if (bound === 'min') return { min: value, max: Math.max(range.max, value) };
  return { min: Math.min(range.min, value), max: value };
}
