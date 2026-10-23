import { getMarkedValueText } from '@/shared/json-safe';
import type { ValueType } from '@/shared/shared-types';

/** What a row shows of a value that is not a container */
export function getPreview(value: unknown, type: ValueType): string {
  switch (type) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
    case 'null':
      return String(value);
    case 'NaN':
    case 'infinity':
    case 'undefined':
      return getMarkedValueText(value) ?? type;
    default:
      return type;
  }
}
