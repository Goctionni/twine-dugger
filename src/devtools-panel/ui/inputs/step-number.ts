/** Without the tail that floating point leaves behind (0.1 + 0.2) */
export const addToNumber = (value: number, amount: number) => +(value + amount).toFixed(6);

/** Without the tail that floating point leaves behind (0.3 * 10), and without cutting small numbers */
const scale = (value: number, direction: 1 | -1) =>
  Number((direction > 0 ? value * 10 : value / 10).toPrecision(15));

/**
 * What the up and down keys make of the number in the field: they add 1; with Shift they add 10.
 * Ctrl with them multiplies by 10 and divides by 10. Undefined for any other key. An empty or half
 * typed field counts as 0.
 */
export function getSteppedNumber(event: KeyboardEvent): number | undefined {
  const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
  const isScaling = event.ctrlKey && !event.shiftKey;
  const isStepping = !event.ctrlKey && !event.altKey && !event.metaKey;
  if (!direction || event.altKey || event.metaKey || !(isScaling || isStepping)) return undefined;

  const typed = (event.currentTarget as HTMLInputElement).valueAsNumber;
  const from = Number.isFinite(typed) ? typed : 0;
  return isScaling
    ? scale(from, direction)
    : addToNumber(from, direction * (event.shiftKey ? 10 : 1));
}
