import { ArrayValue, MapValue, ObjectValue, SetValue } from '@/shared/shared-types';

export type SelectedValue = { name: string | number } & (
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'object'; value: ObjectValue }
  | { type: 'map'; value: MapValue }
  | { type: 'array'; value: ArrayValue }
  | { type: 'set'; value: SetValue }
  | { type: 'function' }
  | { type: 'null' }
  | { type: 'undefined' }
);

export type ValueType = SelectedValue['type'] | 'other';
export type ChildKey<T extends string | number = string | number> = { type: ValueType; text: T };
type ChunkChildren<T extends string | number> = Array<ChildKey<T>>;

export type PathChunk = {
  name: string;
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

export interface NavLayers {
  historyId: 'latest' | number;
  pathChunks: PathChunk[];
}
