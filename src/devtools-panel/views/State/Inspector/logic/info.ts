import {
  getContainerKeys,
  getJsonType,
  getDateText,
  getMarkedValueText,
  isDateMarker,
  isContainerType,
} from '@/shared/json-safe';
import type { JSONSafeContainer, JSONSafeValue, ValueType } from '@/shared/shared-types';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function describeType(value: JSONSafeValue, type: ValueType): string {
  if (type === 'NaN') return 'number · NaN';
  if (type === 'infinity') return 'number · infinite';
  if (type !== 'number') return type;
  const number = value as number;
  return `number · ${Number.isInteger(number) ? 'integer' : 'decimal'}`;
}

export function describeLength(text: string): string {
  const lines = text.split('\n').length;
  const looksLikeNumber = text.trim() !== '' && Number.isFinite(Number(text));
  return `${plural(text.length, 'character')} · ${plural(lines, 'line')}${looksLikeNumber ? ' · looks like a number' : ''}`;
}

export function formatAsJson(value: JSONSafeValue, maxLength = 80): string {
  // The markers of NaN, the infinities, undefined and a Date are shown as the values they stand for
  const text =
    (isDateMarker(value) ? getDateText(value) : getMarkedValueText(value)) ??
    JSON.stringify(value) ??
    'undefined';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** How long ago, in updates of the state, the value changed last. `lastChangeId` is 0 for never */
export function describeAge(latestId: number, lastChangeId: number): string {
  if (lastChangeId === 0) return 'none seen since the panel opened';
  const updates = latestId - lastChangeId;
  if (updates <= 0) return 'in the latest update';
  return `${plural(updates, 'update')} ago`;
}

/** Where a key is among the keys of its parent, in the order of the state, counting from 1 */
export function getPosition(parent: JSONSafeContainer, key: string | number) {
  const type = getJsonType(parent);
  const keys = isContainerType(type) ? getContainerKeys(parent, type) : [];
  return { index: keys.indexOf(key) + 1, total: keys.length };
}
