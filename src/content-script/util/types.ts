/**
 * Represents the primitive types allowed in the data structures.
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Represents any value allowed within the diffed data structures.
 * Includes primitives, containers (object, array, map, set), and functions.
 */
export type Value =
  | Primitive
  | Value[]
  | { [key: string]: Value }
  | Set<Value>
  | Map<string, Value>
  | Function; // Functions are allowed but ignored during diffing

/**
 * Represents a plain JavaScript object used as a container.
 */
export type ObjectValue = { [key: string]: Value };

/**
 * Represents a JavaScript Array used as a container.
 */
export type ArrayValue = Value[];

/**
 * Represents a JavaScript Map used as a container.
 * Assumes string keys for simplicity as per requirements.
 */
export type MapValue = Map<string, Value>;

/**
 * Represents a JavaScript Set used as a container.
 */
export type SetValue = Set<Value>;

/**
 * Represents the path to a value within the data structure,
 * as an array of property keys (string) or array indices (number).
 */
export type Path = Array<string | number>;

// --- Discriminated Union for Diff Objects ---
type DiffGeneric<T extends string> = { type: T; path: Path } & (
  | { subtype: 'add'; newValue: Value }
  | { subtype: 'remove'; oldValue: Value }
);

export type DiffObjectMapChange = DiffGeneric<'object' | 'map'> & {
  key: string;
};
export type DiffArrayChange =
  | (DiffGeneric<'array'> & { index: number })
  | {
      type: 'array';
      subtype: 'instructions';
      path: Path;
      instructions: Instruction[];
    };
export type DiffSetChange = DiffGeneric<'set'>;

/**
 * Represents an update to a primitive value (string, number, boolean).
 */
export interface DiffPrimitiveUpdate {
  type: 'string' | 'number' | 'boolean';
  path: Path; // Path directly to the primitive
  oldValue: Primitive;
  newValue: Primitive;
}

/**
 * Represents a change where the type of a value at a specific path changed.
 */
export interface DiffTypeChange {
  type: 'type-changed';
  path: Path; // Path directly to the value
  oldValue: Value;
  newValue: Value;
}

/**
 * Represents a single difference detected between two data structures.
 * This is a discriminated union based on the `type` field.
 */
export type Diff =
  | DiffObjectMapChange
  | DiffArrayChange
  | DiffSetChange
  | DiffPrimitiveUpdate
  | DiffTypeChange;

// --- Internal Helper Types (Optional Export) ---

/**
 * Internal helper type representing the high-level category of a value.
 * Exporting might be useful for consumers, or keep it internal to the differ.
 */
export type ValueType =
  | 'primitive'
  | 'object'
  | 'array'
  | 'map'
  | 'set'
  | 'function'
  | 'string' // Added for specific primitive diff type
  | 'number' // Added for specific primitive diff type
  | 'boolean'; // Added for specific primitive diff type
// Note: 'null' and 'undefined' are handled under 'primitive' or 'type-changed'

/**
 * Internal type for the identity map. Key is serialized path, Value is reference.
 * Likely best kept internal to the differ module unless needed externally.
 */
export type IdentityMap = Map<string, Value>;

export type MatchPair = {
  oldIndex: number;
  newIndex: number;
  matchType: 'basic' | 'ref' | 'id' | 'deep' | 'index';
  doRecursion: boolean;
};

// --- Instruction Types ---
export type RemoveInstruction = { type: 'remove'; index: number };
export type AddInstruction = { type: 'add'; index: number; value: Value }; // Use Value type
export type MoveInstruction = { type: 'move'; from: number; to: number };
export type Instruction = RemoveInstruction | AddInstruction | MoveInstruction;
