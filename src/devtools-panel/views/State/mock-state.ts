import { getJsonType } from '@/shared/json-safe';
import type { ValueType } from '@/shared/shared-types';

const mockState = {
  character: {
    name: 'Alex',
    age: 27,
    height: 178.5,
    isStudent: false,
    stats: {
      strength: 12,
      charisma: 9,
      luck: 4,
      fitness: {
        running: 4,
        swimming: 2,
        climbing: 7,
        warmedUp: true,
        trainer: 'Sam',
        history: [3, 4, 4, 5],
      },
    },
    skills: { cooking: 3, driving: 5, singing: 1 },
    inventory: ['phone', 'keys', 'wallet', { name: 'bike', condition: 80 }],
    flags: { metSam: true, tutorialDone: false, introSeen: true },
  },
  settings: { volume: 70, subtitles: true, language: 'en' },
  passage: 'Gym',
  turn: 128,
  money: 350.25,
  empty: {},
};

export interface MockEntry {
  key: string;
  type: ValueType;
  /** Of a primitive */
  preview?: string;
  /** Of a container */
  childCount?: number;
}

export interface MockColumn {
  /** The container the column lists the entries of: its path and its key */
  path: string[];
  key: string;
  entries: MockEntry[];
}

const isContainer = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function toEntry(key: string, value: unknown): MockEntry {
  if (isContainer(value)) {
    return { key, type: getJsonType(value), childCount: Object.keys(value).length };
  }
  return {
    key,
    type: getJsonType(value),
    preview: typeof value === 'string' ? JSON.stringify(value) : String(value),
  };
}

function toColumn(path: string[], container: Record<string, unknown>): MockColumn {
  return {
    path,
    key: path.at(-1) ?? 'State',
    entries: Object.entries(container).map(([key, value]) => toEntry(key, value)),
  };
}

/**
 * Mock: one column for every container on the path, and one for what the selected container holds.
 * A selected value that is not a container has no column of its own
 */
export function getMockColumns(path: string[]): MockColumn[] {
  const columns: MockColumn[] = [];
  let current: unknown = mockState;
  for (let depth = 0; depth <= path.length; depth++) {
    if (!isContainer(current) || Object.keys(current).length === 0) break;
    columns.push(toColumn(path.slice(0, depth), current));
    current = current[path[depth]!];
  }
  return columns;
}
