import {
  MARKED_VALUE_WRITE_ERROR,
  SET_MARKER,
  TYPE_KEY,
  getContainerKeys,
  hasNewMarkedValue,
  jsonEqual,
  type ContainerType,
} from '@/shared/json-safe';
import type { JSONSafeArray, JSONSafeObject, JSONSafeValue } from '@/shared/shared-types';

export interface Change {
  op: 'add' | 'set' | 'delete';
  /** The index in the list for an array or a set */
  key: string | number;
  before?: JSONSafeValue;
  after?: JSONSafeValue;
}

export interface Comparison {
  /** What is wrong with the text: when there is something, nothing can be saved */
  error?: string;
  changes: Change[];
  /** Properties that are not part of the edit, but the text has them: saving overwrites them */
  warnings: string[];
}

const fail = (error: string): Comparison => ({ error, changes: [], warnings: [] });

/**
 * What saving the text would do to the container.
 * `keysInEdit` are the properties the text was made from: a property missing from the text is only
 * deleted when it is one of them. (Not used for an array or a set: their text has all the items.)
 */
export function compareJson(
  containerType: ContainerType,
  container: JSONSafeValue,
  keysInEdit: readonly string[],
  text: string,
): Comparison {
  let edited: unknown;
  try {
    edited = JSON.parse(text);
  } catch (error) {
    return fail((error as Error).message);
  }

  const comparison =
    containerType === 'array' || containerType === 'set'
      ? compareItems(containerType, container as JSONSafeArray, edited)
      : compareProperties(containerType, container as JSONSafeObject, keysInEdit, edited);

  // The panel does not write NaN, the infinities or undefined: a marker is only there to stay
  const writesMarker = comparison.changes.some(
    (change) => change.op !== 'delete' && hasNewMarkedValue(change.before, change.after),
  );
  return writesMarker ? fail(MARKED_VALUE_WRITE_ERROR) : comparison;
}

function compareItems(type: 'array' | 'set', container: JSONSafeArray, edited: unknown) {
  if (!Array.isArray(edited)) return fail('Expected an array');
  if (type === 'set' && edited[0] === SET_MARKER) {
    return fail('A set is edited as an array: leave its marker out');
  }

  // The first element of a set is its marker, not an item
  const items = type === 'set' ? container.slice(1) : container;
  const changes: Change[] = [];

  edited.forEach((after: JSONSafeValue, index) => {
    const before = items[index];
    if (index >= items.length) changes.push({ op: 'add', key: index, after });
    else if (!jsonEqual(before!, after)) changes.push({ op: 'set', key: index, before, after });
  });

  // From the last item: each delete moves the items after it
  for (let index = items.length - 1; index >= edited.length; index--) {
    changes.push({ op: 'delete', key: index, before: items[index] });
  }

  return { changes, warnings: [] };
}

function compareProperties(
  type: 'object' | 'map',
  container: JSONSafeObject,
  keysInEdit: readonly string[],
  edited: unknown,
) {
  if (typeof edited !== 'object' || edited === null || Array.isArray(edited)) {
    return fail('Expected an object');
  }
  if (TYPE_KEY in edited) return fail(`"${TYPE_KEY}" is a reserved name`);

  const existingKeys = new Set(getContainerKeys(container, type).map(String));
  const changes: Change[] = [];
  const warnings: string[] = [];

  for (const [key, after] of Object.entries(edited) as [string, JSONSafeValue][]) {
    const before = container[key];
    if (!existingKeys.has(key)) {
      changes.push({ op: 'add', key, after });
    } else if (!jsonEqual(before!, after)) {
      if (!keysInEdit.includes(key)) {
        warnings.push(
          `"${key}" exists on this ${type} but is not part of this edit; saving overwrites it.`,
        );
      }
      changes.push({ op: 'set', key, before, after });
    }
  }

  for (const key of keysInEdit) {
    if (!(key in edited)) changes.push({ op: 'delete', key, before: container[key] });
  }

  return { changes, warnings };
}
