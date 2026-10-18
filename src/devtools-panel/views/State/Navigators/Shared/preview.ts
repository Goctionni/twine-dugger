import type { ValueType } from '@/shared/shared-types';

/** What a row shows of a value that is not a container */
export function getPreview(value: unknown, type: ValueType): string {
  switch (type) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
    case 'null':
    case 'undefined':
      return String(value);
    default:
      return type;
  }
}
