import { ArrayValue, MapValue, ObjectValue, Path, ValueType } from '@/shared/shared-types';

type ChildKey<T extends string | number = string | number> = { type: ValueType; text: T };
type ChunkChildren<T extends string | number> = Array<ChildKey<T>>;

export type PathChunk = {
  name: string;
  path: Path;
} & (
  | {
      type: 'object';
      getValue(): ObjectValue;
      childKeys: ChunkChildren<string>;
    }
  | {
      type: 'map';
      getValue(): MapValue;
      childKeys: ChunkChildren<string>;
    }
  | {
      type: 'array';
      getValue(): ArrayValue;
      childKeys: ChunkChildren<number>;
    }
);
