export type Primitive = string | number | boolean | null | undefined;

export type Value =
  | Primitive
  | Value[]
  | { [key: string]: Value }
  | Set<Value>
  | Map<string, Value>
  | Function;

export type ObjectValue = { [key: string]: Value };

export type ArrayValue = Value[];

export type MapValue = Map<string, Value>;

export type SetValue = Set<Value>;

export type ContainerValue = ObjectValue | ArrayValue | MapValue;

export type Path = Array<string | number>;

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

export interface DiffPrimitiveUpdate {
  type: 'string' | 'number' | 'boolean';
  path: Path;
  oldValue: Primitive;
  newValue: Primitive;
}

export interface DiffTypeChange {
  type: 'type-changed';
  path: Path;
  oldValue: Value;
  newValue: Value;
}

export type Diff =
  | DiffObjectMapChange
  | DiffArrayChange
  | DiffSetChange
  | DiffPrimitiveUpdate
  | DiffTypeChange;

export type ProcessDiffResult = {
  diffs: Diff[];
  locksUpdate: Path[] | null;
};

type DiffPackage = {
  passage: string;
  diffs: Diff[];
};

export type UpdateResult = {
  diffPackage: DiffPackage | null;
  locksUpdate: Path[] | null;
};

export type ValueType =
  | 'other'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'map'
  | 'set'
  | 'function'
  | 'string'
  | 'number'
  | 'boolean';

export type IdentityMap = Map<string, Value>;

export type MatchPair = {
  oldIndex: number;
  newIndex: number;
  matchType: 'basic' | 'ref' | 'id' | 'deep' | 'index';
  doRecursion: boolean;
};

export type RemoveInstruction = { type: 'remove'; index: number };
export type AddInstruction = { type: 'add'; index: number; value: Value };
export type MoveInstruction = { type: 'move'; from: number; to: number };
export type Instruction = RemoveInstruction | AddInstruction | MoveInstruction;

export interface DiffFrame {
  timestamp: Date;
  passage: string;
  changes: Diff[];
}

export interface StateFrame {
  id: number;
  diffingFrame?: DiffFrame;
  state: ObjectValue;
}

export type LockStatus = 'locked' | 'ancestor-lock' | 'unlocked';

type KnownPassageAttribute = 'content' | 'pid' | 'name' | 'tags' | 'position' | 'size';
type PassageAttribute = KnownPassageAttribute | (string & {});
export type PassageData = Record<PassageAttribute, string>;
