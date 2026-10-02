import type { JSX } from '@solidjs/web';
import { type } from 'arktype';
import type { Delta } from 'jsondiffpatch';

import type { TYPE_KEY } from './json-safe';

export type Primitive = string | number | boolean | null | undefined;

export type Value =
  | Primitive
  | Value[]
  | { [key: string]: Value }
  | Set<Value>
  | Map<string | number, Value>
  | Function;

export type JSONSafeValue = Primitive | JSONSafeValue[] | { [key: string]: JSONSafeValue };
export type JSONSafeArray = JSONSafeValue[];
export type JSONSafeObject = { [key: string]: JSONSafeValue };
export type JSONSafeDate = { [TYPE_KEY]: 'Date' } & Record<
  'Y' | 'M' | 'D' | 'h' | 'm' | 's',
  number
>;

export type ObjectValue = { [key: string]: Value };

export type ArrayValue = Value[];

export type MapValue = Map<string | number, Value>;

export type SetValue = Set<Value>;

export type ContainerValue = ObjectValue | ArrayValue | MapValue;

export const pathSchema = type('(string | number)[]');
export type Path = typeof pathSchema.infer;

export type PropertyFilterKey = ValueType | 'filtered';

export const jsonSafeValueSchema = type(
  'string | number | boolean | null | object',
).as<JSONSafeValue>();
export const lockSchema = type({ path: pathSchema, value: jsonSafeValueSchema });
export type Lock = typeof lockSchema.infer;

export interface LockRevert {
  path: Path;
  attempted: JSONSafeValue;
}

export type InitUpdate = { type: 'init'; passage: string; state: JSONSafeObject };
export type DeltaUpdate = {
  type: 'update';
  passage: string;
  delta: Delta;
  reverts: LockRevert[];
};
export type UpdateResult = InitUpdate | DeltaUpdate;

export const valueTypeSchema = type(
  "'other' | 'null' | 'undefined' | 'object' | 'array' | 'map' | 'set' | 'function' | 'date' | 'string' | 'number' | 'boolean'",
);
export type ValueType = typeof valueTypeSchema.infer;

export type LockStatus = 'locked' | 'ancestor-lock' | 'unlocked';

type KnownPassageAttribute = 'content' | 'pid' | 'name' | 'tags' | 'position' | 'size';
type PassageAttribute = KnownPassageAttribute | (string & {});
export type PassageData = Record<PassageAttribute, string>;

export interface ParsedPassageData {
  id: number;
  name: string;
  size: [number, number] | null;
  position: [number, number] | null;
  content: string;
  tags: string[];
}
export const propertyOrderSchema = type("'alphabetic' | 'type' | 'most-recent' | 'none'");
export type PropertyOrder = typeof propertyOrderSchema.infer;
export interface OrderConfig {
  orderBy: PropertyOrder;
  descending: boolean;
}
export type Page = 'state' | 'search' | 'passages' | 'settings';
export type ConnectionState =
  | 'candidate-iframes'
  | 'killed'
  | 'loading-meta'
  | 'no-game-detected'
  | 'loading-game'
  | 'error'
  | 'live'
  | 'not-enabled'
  | 'incompatible';

export interface CandidateGameIframes {
  __type: 'candidate-game-iframes';
  urls: string[];
}

export interface VersionInfo {
  major: number | undefined;
  minor: number | undefined;
  patch: number | undefined;
  shortStr: string;
}

export interface GameMetaData {
  name: string;
  ifId: string;
  save?: {
    numSlots: number;
    slotsUsed: number;
    storage?: string;
    storageCapacity?: number;
    storageUsed?: number;
    storageUsedPct?: number;
  };
  passages?: {
    start: string;
    count?: number;
  };
  format?: {
    name: 'SugarCube' | 'Harlowe' | 'Chapbook' | 'Snowman';
    version?: VersionInfo;
  };
  framework?: {
    name: 'XLowe';
    version: VersionInfo;
  };
  compiler?: {
    name: string;
    version?: string;
  };
  settings?: {
    historyControls: boolean;
    historyMax: number;
  };
  incompatible?: string[];
}

export interface SearchResultState {
  path: Path;
  value: Value;
}

export interface SearchResultsCombined {
  state: SearchResultState[];
  passage: ParsedPassageData[];
}

export type Placement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right';

export type PlacementFlip = 'flip-block' | 'flip-inline' | 'flip-both';
export type PlacementOrFallback = Placement | PlacementFlip;
export interface TooltipConfig {
  anchor?: 'cursor' | 'element';
  placement?: Placement | [Placement, ...PlacementOrFallback[]];
  offset?: number;
}
type TooltipContent = string | JSX.Element;
export type TooltipValue = TooltipContent | [TooltipContent, TooltipConfig];

export interface FormatPassage {
  name: string;
  source: string;
  tags?: string[];
  position?: [number, number];
  size?: [number, number];
}

// Maybe at a later point convert all of the `[storyformat]Globals` interfaces to arktype schemas
export interface SugarCubeGlobals {
  SugarCube: {
    Config: {
      passages: {
        start: string;
      };
      history: {
        controls: boolean;
        maxStates: number;
      };
      saves?: {
        maxSlotSaves?: number;
      };
    };
    Save: {
      browser?: {
        slot?: {
          size?: number;
        };
      };
      slots: {
        length: number;
        count(): number;
      };
    };
    State: {
      variables: ObjectValue;
      passage: string;
    };
    Story: {
      name?: string;
      title?: string;
      get ifId(): string;
      has(name: string): boolean;
      get(name: string): SugarCubePassage;
      add(passage: SugarCubePassage): boolean;
    };
    storage: {
      name: string;
    };
    version: {
      major: number;
      minor: number;
      patch: number;
      build: number;
      long(): string;
      short(): string;
      toString(): string;
    };
    Engine: {
      play(passageName: string): void;
    };
  };
}

export interface HarloweGlobals {
  __HarloweInternals: {
    state: {
      variables: ObjectValue;
      passage: string;
    };
    engine: {
      goToPassage(name: string): void;
    };
    passages?: {
      create(el: HTMLElement): Map<string, unknown>;
      set(name: string, passage: Map<string, unknown>): void;
      clearTreeCache(): void;
      clearStoryletCache(): void;
      clearTagCache?: () => void;
      values?: () => MapIterator<Map<'source' | 'tags' | 'name', string>>;
    };
  };
}

export interface XLoweGlobals {
  XLowe: {
    story?: { ifid?: unknown; name?: unknown };
    framework?: unknown;
    engine?: unknown;
  };
}

export interface HarloweGlobalsMacroFramework {
  Harlowe: {
    API_ACCESS: {
      STATE: {
        variables: ObjectValue;
        passage: string;
      };
      ENGINE: {
        goToPassage(name: string): void;
      };
      PASSAGES?: {
        create(el: HTMLElement): Map<string, unknown>;
        set(name: string, passage: Map<string, unknown>): void;
        clearTreeCache(): void;
        clearStoryletCache(): void;
        clearTagCache?: () => void;
      };
    };
  };
}

export interface ChapbookGlobals {
  engine: {
    state: {
      set: (path: string, value: unknown) => unknown;
      get: (path: string) => Value;
      saveToObject: () => ObjectValue;
      restoreFromObject: (obj: ObjectValue) => void;
    };
    story: {
      ifid: () => string;
      name: () => string;
      startPassage: () => GenericPassage;
      passages: () => GenericPassage[];
      passageNamed: (name: string) => GenericPassage | undefined;
    };
    version: string;
  };
  go: (passageName: string) => void;
}

export interface SnowmanGlobals {
  story: {
    name: string;
    startPassage: number;
    creator: string;
    creatorVersion: string;
    history: number[];
    state: ObjectValue;
    passages: GenericPassage[];
    passage: (nameOrId: string | number) => GenericPassage | undefined;
    show: (name: string) => unknown;
  };
  passage: GenericPassage;
}

interface GenericPassage {
  id: number;
  name: string;
  source: string;
  tags: string[];
}

interface SugarCubePassage {
  name: string;
  tags: string[];
  text: string;
  element?: HTMLElement;
}
