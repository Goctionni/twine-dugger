import { createInstructions } from './createInstructions';
import type {
  Value,
  Path,
  ObjectValue,
  ArrayValue,
  MapValue,
  SetValue,
  Diff,
  ValueType,
  IdentityMap,
  MatchPair, // Assuming MatchPair is defined in types.ts now
  Primitive,
} from './types'; // Import types from types.ts

// --- Helper Functions ---

// Serializes a path array into a string key for the IdentityMap.
function serializePath(path: Path): string {
  return path.join('\u0000');
}

// Determines the type category, including specific primitives.
export function getType(value: Value): ValueType {
  if (typeof value === 'function') return 'function';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Set) return 'set';
  if (value instanceof Map) return 'map';
  if (typeof value === 'object' && value !== null) return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  // Treat null/undefined as 'primitive' for general type checking,
  // specific diffs will handle them via type-changed or updates from/to them.
  return 'primitive';
}

// List of common ID keys to check (case-insensitive).
const COMMON_ID_KEYS = ['id', '_id', 'key', 'uuid'];

// Extracts a potential ID value from an object based on common keys.
function getPotentialId(obj: ObjectValue): Primitive | undefined {
  const objectValue = obj as ObjectValue;
  for (const key of COMMON_ID_KEYS) {
    const actualKey = Object.keys(objectValue).find((k) => k.toLowerCase() === key);
    if (actualKey && typeof objectValue[actualKey] !== 'object') {
      return objectValue[actualKey] as Primitive;
    }
  }
  return undefined;
}

// --- Deep Equality Check (Unchanged from your paste) ---
function deepEquals(val1: Value, val2: Value): boolean {
  if (Object.is(val1, val2)) return true;
  // Use basic typeof for type check within deepEquals, getType is for diff logic
  const type1 = typeof val1;
  const type2 = typeof val2;
  if (type1 !== type2 || val1 === null || val2 === null || type1 === 'function') {
    // Treat functions as equal if both are functions, unequal otherwise
    return type1 === 'function' && type2 === 'function';
  }

  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    return val1.every((item, index) => deepEquals(item, val2[index]));
  }
  if (val1 instanceof Set && val2 instanceof Set) {
    if (val1.size !== val2.size) return false;
    const tempSet2 = Array.from(val2);
    return Array.from(val1).every((item1) => {
      const matchIndex = tempSet2.findIndex((item2) => deepEquals(item1, item2));
      if (matchIndex === -1) return false;
      tempSet2.splice(matchIndex, 1);
      return true;
    });
  }
  if (val1 instanceof Map && val2 instanceof Map) {
    if (val1.size !== val2.size) return false;
    return Array.from(val1.entries()).every(
      ([key, value1]) => val2.has(key) && deepEquals(value1, val2.get(key)),
    );
  }
  // Check for plain objects after other types
  if (
    type1 === 'object' &&
    !Array.isArray(val1) &&
    !(val1 instanceof Set) &&
    !(val1 instanceof Map) &&
    !Array.isArray(val2) &&
    !(val2 instanceof Set) &&
    !(val2 instanceof Map)
  ) {
    const obj1 = val1 as ObjectValue;
    const obj2 = val2 as ObjectValue;
    const keys1 = Object.keys(obj1);
    if (keys1.length !== Object.keys(obj2).length) return false;
    return keys1.every((key) => obj2.hasOwnProperty(key) && deepEquals(obj1[key], obj2[key]));
  }

  // If none of the above, must be primitives that failed Object.is
  return false;
}

// --- Public API Factory ---
export function getDiffer(ignoreCheck?: (key: string, value: Value) => boolean) {
  let storedIdentityMap: IdentityMap = new Map(); // State is private to this instance

  // --- Diffing Logic Helpers (Defined inside factory) ---

  function diffEntries(
    containerType: 'object' | 'map', // Specify container type
    oldEntries: Map<string, Value>,
    newEntries: Map<string, Value>,
    path: Path, // Path to the container
    diffs: Diff[],
    newMap: IdentityMap,
  ) {
    const allKeys = new Set([...oldEntries.keys(), ...newEntries.keys()]);

    for (const key of allKeys) {
      if (ignoreCheck) {
        if (ignoreCheck(key, oldEntries.get(key))) continue;
        if (ignoreCheck(key, newEntries.get(key))) continue;
      }
      const currentPath = path.concat(key); // Path to the property/entry
      const oldValExists = oldEntries.has(key);
      const newValExists = newEntries.has(key);
      const oldVal = oldEntries.get(key);
      const newVal = newEntries.get(key);

      if (newValExists && getType(newVal) !== 'primitive') {
        newMap.set(serializePath(currentPath), newVal);
      }

      if (oldValExists && !newValExists) {
        // Use container path, add key
        diffs.push({
          type: containerType,
          subtype: 'remove',
          path: path, // Path to container
          key: key,
          oldValue: oldVal, // Removed value
        });
      } else if (!oldValExists && newValExists) {
        // Use container path, add key
        diffs.push({
          type: containerType,
          subtype: 'add',
          path: path, // Path to container
          key: key,
          newValue: newVal, // Added value
        });
      } else if (oldValExists && newValExists) {
        // Key exists in both: Recurse using direct path
        // eslint-disable-next-line no-use-before-define
        findDifferences(oldVal, newVal, currentPath, diffs, newMap);
      }
    }
  }

  function diffArrays(
    oldArr: ArrayValue,
    newArr: ArrayValue,
    path: Path, // Path to the array
    diffs: Diff[],
    newIdentityMap: IdentityMap,
  ) {
    const oldLen = oldArr.length;
    const newLen = newArr.length;
    const minLen = Math.min(oldLen, newLen);
    const oldMatched = new Array(oldLen).fill(false);
    const newMatched = new Array(newLen).fill(false);
    const matchedPairs: MatchPair[] = [];
    let foundRefOrIdMatch = false;

    // Cache objects for future run
    for (let i = 0; i < newLen; i++) {
      const newItem = newArr[i];
      if (getType(newItem) !== 'primitive') {
        newIdentityMap.set(serializePath(path.concat(i)), newItem);
      }
    }

    // Pass 1: Basic Equality at same index
    for (let i = 0; i < minLen; i++) {
      if (!Object.is(oldArr[i], newArr[i])) continue;

      oldMatched[i] = true;
      newMatched[i] = true;
      matchedPairs.push({
        oldIndex: i,
        newIndex: i,
        matchType: 'basic',
        doRecursion: false,
      });
      foundRefOrIdMatch = true;
    }

    // Pass 2: Referential equality at same index via identity map
    for (let i = 0; i < minLen; i++) {
      if (oldMatched[i] || getType(oldArr[i]) === 'primitive') continue;
      if (newMatched[i] || getType(newArr[i]) === 'primitive') continue;
      const oldItemPath = serializePath(path.concat(i));
      const oldItem = storedIdentityMap.get(oldItemPath);
      if (oldItem !== newArr[i]) continue;

      oldMatched[i] = true;
      newMatched[i] = true;
      matchedPairs.push({
        oldIndex: i,
        newIndex: i,
        matchType: 'ref',
        doRecursion: true,
      });
      foundRefOrIdMatch = true;
    }

    // Pass 3: ID key equality at same index
    for (let i = 0; i < minLen; i++) {
      if (oldMatched[i] || newMatched[i]) continue;
      if (oldMatched[i] || getType(oldArr[i]) !== 'object') continue;
      if (newMatched[i] || getType(newArr[i]) !== 'object') continue;

      const oldId = getPotentialId(oldArr[i] as ObjectValue);
      if (oldId === undefined) continue;
      const newId = getPotentialId(newArr[i] as ObjectValue);
      if (newId === undefined) continue;
      if (!Object.is(oldId, newId)) continue;

      oldMatched[i] = true;
      newMatched[i] = true;
      matchedPairs.push({
        oldIndex: i,
        newIndex: i,
        matchType: 'id',
        doRecursion: true,
      });
      foundRefOrIdMatch = true;
    }

    // Pass 4: Deep equality at same index, but only if no ref or id was matched
    if (!foundRefOrIdMatch) {
      for (let i = 0; i < minLen; i++) {
        if (oldMatched[i] || getType(oldArr[i]) === 'primitive') continue;
        if (newMatched[i] || getType(newArr[i]) === 'primitive') continue;
        if (!deepEquals(oldArr[i], newArr[i])) continue;

        oldMatched[i] = true;
        newMatched[i] = true;
        matchedPairs.push({
          oldIndex: i,
          newIndex: i,
          matchType: 'deep',
          doRecursion: false,
        });
        break;
      }
    }

    // Pass 5: Basic Equality at any index (handles primitives and identical objects/refs)
    for (let oldIndex = 0; oldIndex < oldLen; oldIndex++) {
      if (oldMatched[oldIndex]) continue;
      for (let newIndex = 0; newIndex < newLen; newIndex++) {
        if (newMatched[newIndex]) continue;
        if (oldIndex === newIndex) continue;
        if (!Object.is(oldArr[oldIndex], newArr[newIndex])) continue;

        oldMatched[oldIndex] = true;
        newMatched[newIndex] = true;
        matchedPairs.push({
          oldIndex,
          newIndex,
          matchType: 'basic',
          doRecursion: false,
        });
        break;
      }
    }

    // Pass 6: Referential equality at any index via identity map
    for (let oldIndex = 0; oldIndex < oldLen; oldIndex++) {
      if (oldMatched[oldIndex] || getType(oldArr[oldIndex]) === 'primitive') continue;

      const oldItemPath = serializePath(path.concat(oldIndex));
      const oldItem = storedIdentityMap.get(oldItemPath);
      if (oldItem === undefined) continue;
      for (let newIndex = 0; newIndex < newLen; newIndex++) {
        if (newMatched[newIndex] || getType(newArr[newIndex]) === 'primitive') continue;
        if (oldItem === newArr[newIndex]) {
          oldMatched[oldIndex] = true;
          newMatched[newIndex] = true;
          matchedPairs.push({ oldIndex, newIndex, matchType: 'ref', doRecursion: true });
          foundRefOrIdMatch = true;
          break;
        }
      }
    }

    // Pass 7: ID key equality at any index
    for (let oldIndex = 0; oldIndex < oldLen; oldIndex++) {
      if (oldMatched[oldIndex] || getType(oldArr[oldIndex]) !== 'object') continue;
      const oldId = getPotentialId(oldArr[oldIndex] as ObjectValue);
      if (oldId === undefined) continue;

      for (let newIndex = 0; newIndex < newLen; newIndex++) {
        if (oldIndex === newIndex) continue;
        if (newMatched[newIndex] || getType(newArr[newIndex]) !== 'object') continue;
        const newId = getPotentialId(newArr[newIndex] as ObjectValue);
        if (newId === undefined) continue;
        if (!Object.is(oldId, newId)) continue;

        oldMatched[oldIndex] = true;
        newMatched[newIndex] = true;
        matchedPairs.push({
          oldIndex,
          newIndex,
          matchType: 'id',
          doRecursion: true,
        });
        foundRefOrIdMatch = true;
        break;
      }
    }

    // Pass 8: Deep Equality (Conditional)
    if (!foundRefOrIdMatch) {
      for (let oldIndex = 0; oldIndex < oldLen; oldIndex++) {
        if (oldMatched[oldIndex] || getType(oldArr[oldIndex]) === 'primitive') continue;

        for (let newIndex = 0; newIndex < newLen; newIndex++) {
          if (newMatched[newIndex] || getType(newArr[newIndex]) === 'primitive') continue;
          if (!deepEquals(oldArr[oldIndex], newArr[newIndex])) continue;

          oldMatched[oldIndex] = true;
          newMatched[newIndex] = true;
          matchedPairs.push({
            oldIndex,
            newIndex,
            matchType: 'deep',
            doRecursion: false,
          });
          break;
        }
      }
    }

    // Pass 9: Same index, both unmatched
    for (let i = 0; i < minLen; i++) {
      if (oldMatched[i] || newMatched[i]) continue;

      oldMatched[i] = true;
      newMatched[i] = true;
      matchedPairs.push({
        oldIndex: i,
        newIndex: i,
        matchType: 'index',
        doRecursion: true,
      });
    }

    // Create basic diffs

    // Report Diffs (using new format)
    for (let oldIndex = 0; oldIndex < oldLen; oldIndex++) {
      if (!oldMatched[oldIndex]) {
        diffs.push({
          type: 'array',
          subtype: 'remove',
          path: path, // Path to array
          index: oldIndex,
          oldValue: oldArr[oldIndex], // Removed value
        });
      }
    }

    for (let newIndex = 0; newIndex < newLen; newIndex++) {
      if (!newMatched[newIndex]) {
        diffs.push({
          type: 'array',
          subtype: 'add',
          path, // Path to array
          index: newIndex,
          newValue: newArr[newIndex], // Added value
        });
      }
    }

    const instructions = createInstructions(newArr, oldMatched, newMatched, matchedPairs);
    if (instructions.length) {
      diffs.push({
        type: 'array',
        subtype: 'instructions',
        path,
        instructions,
      });
    }

    // Recurse on Matched Pairs (Ref or ID only)
    for (const { oldIndex, newIndex, doRecursion } of matchedPairs) {
      if (doRecursion) {
        findDifferences(
          oldArr[oldIndex],
          newArr[newIndex],
          path.concat(newIndex), // Direct path to element
          diffs,
          newIdentityMap,
        );
      }
    }
  }

  function diffSets(
    oldSet: SetValue,
    newSet: SetValue,
    path: Path, // Path to the set
    diffs: Diff[],
    newIdentityMap: IdentityMap,
  ) {
    const oldSize = oldSet.size;
    const newSize = newSet.size;
    const oldItems = Array.from(oldSet);
    const newItems = Array.from(newSet);
    const oldMatched = new Array(oldSize).fill(false);
    const newMatched = new Array(oldSize).fill(false);
    type SetRecursionEntry = { oldItem: Value; newItem: Value; id: Primitive };
    const recursionPairs: SetRecursionEntry[] = [];

    // Store set items for matching by reference
    const pathKey = serializePath(path.concat('__SET'));
    newIdentityMap.set(pathKey, oldItems);
    const storedSetArr = storedIdentityMap.get(pathKey) as ArrayValue | undefined;

    // Compare by === (no recursion, not needed)
    for (let oldIndex = 0; oldIndex < oldSize; oldIndex++) {
      const oldItem = oldItems[oldIndex];
      const newIndex = oldItems.indexOf(oldItem);
      if (newIndex === -1) continue;
      oldMatched[oldIndex] = true;
      newMatched[newIndex] = true;
    }

    // Compare by id (recursion, path entry is `? id`)
    for (let oldIndex = 0; oldIndex < oldSize; oldIndex++) {
      if (oldMatched[oldIndex]) continue;
      const oldItem = oldItems[oldIndex];
      if (getType(oldItem) !== 'object') continue;
      const oldId = getPotentialId(oldItem as ObjectValue);
      if (!oldId) continue;

      for (let newIndex = 0; newIndex < newSize; newIndex++) {
        if (newMatched[newIndex]) continue;
        const newItem = newItems[newIndex];
        if (getType(newItem) !== 'object') continue;
        const newId = getPotentialId(newItem as ObjectValue);
        if (!newId) continue;

        oldMatched[oldIndex] = true;
        newMatched[newIndex] = true;
        recursionPairs.push({ oldItem, newItem, id: oldId });
        break;
      }
    }

    // Compare by deepEq (no recursion)
    for (let oldIndex = 0; oldIndex < oldSize; oldIndex++) {
      if (oldMatched[oldIndex]) continue;
      if (getType(oldItems[oldIndex]) === 'primitive') continue;

      for (let newIndex = 0; newIndex < newSize; newIndex++) {
        if (newMatched[newIndex]) continue;
        if (getType(newItems[newIndex]) === 'primitive') continue;
        if (!deepEquals(oldItems[oldIndex], newItems[newIndex])) continue;

        oldMatched[oldIndex] = true;
        newMatched[newIndex] = true;
        break;
      }
    }

    // Compare by identity (recursion, path entry is ?)
    if (storedSetArr) {
      for (let oldIndex = 0; oldIndex < oldSize; oldIndex++) {
        if (oldMatched[oldIndex]) continue;
        if (getType(storedSetArr[oldIndex]) !== 'primitive') continue;
        const newIndex = newItems.indexOf(storedSetArr[oldIndex]);
        if (newIndex === -1) continue;

        oldMatched[oldIndex] = true;
        newMatched[newIndex] = true;
        recursionPairs.push({
          oldItem: oldItems[oldIndex],
          newItem: newItems[newIndex],
          id: '',
        });
        break;
      }
    }

    for (let i = 0; i < Math.max(oldSize, newSize); i++) {
      if (oldMatched[i] === false) {
        diffs.push({
          type: 'set',
          subtype: 'remove',
          oldValue: oldItems[i],
          path,
        });
      }
      if (newMatched[i] === false) {
        diffs.push({
          type: 'set',
          subtype: 'add',
          newValue: newItems[i],
          path,
        });
      }
    }

    for (const { id, oldItem, newItem } of recursionPairs) {
      findDifferences(oldItem, newItem, path.concat(`${id}`), diffs, newIdentityMap);
    }
  }

  // Core Recursive Diff Function
  function findDifferences(
    oldVal: Value,
    newVal: Value,
    path: Path, // Direct path to current value
    diffs: Diff[],
    newMap: IdentityMap,
  ) {
    if (getType(newVal) !== 'primitive') {
      newMap.set(serializePath(path), newVal);
    }

    if (Object.is(oldVal, newVal)) return;

    const oldType = getType(oldVal);
    const newType = getType(newVal);

    // Handle Type Change first
    if (oldType !== newType) {
      // Ignore if both are functions
      if (!(oldType === 'function' && newType === 'function')) {
        diffs.push({
          type: 'type-changed',
          path: path, // Direct path
          oldValue: oldVal,
          newValue: newVal,
        });
      }
      return;
    }

    // Ignore functions if types match
    if (oldType === 'function') return;

    // Handle same types
    switch (oldType) {
      case 'object':
        diffEntries(
          'object', // Specify container type
          new Map(Object.entries(oldVal as ObjectValue)),
          new Map(Object.entries(newVal as ObjectValue)),
          path, // Pass direct path (container path for diffs)
          diffs,
          newMap,
        );
        break;
      case 'map':
        diffEntries(
          'map', // Specify container type
          oldVal as MapValue,
          newVal as MapValue,
          path, // Pass direct path (container path for diffs)
          diffs,
          newMap,
        );
        break;
      case 'array':
        diffArrays(
          oldVal as ArrayValue,
          newVal as ArrayValue,
          path, // Pass direct path (container path for diffs)
          diffs,
          newMap,
        );
        break;
      case 'set':
        diffSets(
          oldVal as SetValue,
          newVal as SetValue,
          path, // Pass direct path (container path for diffs)
          diffs,
          newMap,
        );
        break;
      // Handle specific primitive type updates
      case 'string':
      case 'number':
      case 'boolean':
        diffs.push({
          type: oldType, // 'string', 'number', or 'boolean'
          path: path, // Direct path
          oldValue: oldVal as Primitive,
          newValue: newVal as Primitive,
        });
        break;
      case 'primitive':
        // This case handles null <-> undefined changes if Object.is failed,
        // or other potential primitive mismatches not caught by specific types.
        // Report as type-changed for clarity.
        diffs.push({
          type: 'type-changed',
          path: path,
          oldValue: oldVal,
          newValue: newVal,
        });
        break;
    }
  }

  // The actual function returned by the factory
  return function deepDiffInstance(clonedOldValue: Value, liveNewValue: Value): Diff[] {
    const diffs: Diff[] = [];
    const newIdentityMap: IdentityMap = new Map();

    findDifferences(
      clonedOldValue,
      liveNewValue,
      [], // Initial path
      diffs,
      newIdentityMap,
    );

    storedIdentityMap = newIdentityMap; // Update map for next cycle
    return diffs;
  };
} // End getDiffer factory
