import type { JSONSafeValue, Lock } from './shared-types';

/** What the value has to be: itself when the lock allows it, else the nearest value that it does */
export function getAllowedValue(
  attempted: JSONSafeValue,
  { value, min, max }: Lock,
): JSONSafeValue {
  const isRangeLock = min !== undefined && max !== undefined;
  if (!isRangeLock || typeof attempted !== 'number' || Number.isNaN(attempted)) return value;
  return Math.min(Math.max(attempted, min), max);
}
