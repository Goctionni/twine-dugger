import { GameMetaData, ObjectValue, PassageData } from '@/shared/shared-types';

export interface MockTwineGameSeed {
  readonly meta: GameMetaData;
  readonly initialPassage: string;
  readonly state: ObjectValue;
  readonly passages: PassageData[];
}

export const baselineMockTwineGameSeed = {
  meta: {
    name: 'Mock SugarCube Story',
    ifId: 'MOCK-IFID-001',
    compiler: {
      name: 'Tweego',
      version: '2.1.1',
    },
    format: {
      name: 'SugarCube',
      version: {
        major: 2,
        minor: 37,
        patch: 3,
        shortStr: '2.37.3',
      },
    },
    passages: {
      start: 'Start',
      count: 2,
    },
    save: {
      numSlots: 8,
      slotsUsed: 2,
      storage: 'localStorage',
      storageCapacity: 5_242_880,
      storageUsed: 2_048,
      storageUsedPct: 0.04,
    },
    settings: {
      historyControls: true,
      historyMax: 100,
    },
  },
  initialPassage: 'Start',
  state: {
    player: {
      name: 'Avery',
      stats: {
        health: 10,
        mana: 3,
      },
    },
    inventory: ['knife', 'rope'],
    flags: {
      tutorialSeen: true,
    },
  },
  passages: [
    {
      pid: '1',
      name: 'Start',
      tags: 'intro',
      position: '120,130',
      size: '240,100',
      content: 'Welcome.',
    },
    {
      pid: '2',
      name: 'Forest',
      tags: 'scene',
      position: '380,120',
      size: '260,120',
      content: 'You step into woods.',
    },
  ],
} as const satisfies MockTwineGameSeed;

export function cloneMockTwineGameSeed(seed: MockTwineGameSeed = baselineMockTwineGameSeed) {
  return structuredClone(seed);
}

export function createMockTwineGameSeed(
  seedPatch: Partial<MockTwineGameSeed> = {},
  statePatch: ObjectValue = {},
) {
  const seed = cloneMockTwineGameSeed();
  return {
    ...seed,
    ...seedPatch,
    state: {
      ...seed.state,
      ...statePatch,
    },
  } satisfies MockTwineGameSeed;
}

export function createLargeTopLevelSeed(
  count: number,
  baseSeed: MockTwineGameSeed = baselineMockTwineGameSeed,
) {
  const state: ObjectValue = {};
  for (let index = 0; index < count; index += 1) {
    const key = `var_${String(index + 1).padStart(3, '0')}`;
    state[key] = index;
  }
  return createMockTwineGameSeed(baseSeed, state);
}

export function createSugarCubeWindowMock(seed: MockTwineGameSeed = baselineMockTwineGameSeed) {
  const copy = cloneMockTwineGameSeed(seed);
  const version = copy.meta.format?.version;
  return {
    Config: {
      passages: {
        start: copy.meta.passages?.start ?? copy.initialPassage,
      },
      history: {
        controls: copy.meta.settings?.historyControls ?? true,
        maxStates: copy.meta.settings?.historyMax ?? 100,
      },
      saves: {
        maxSlotSaves: copy.meta.save?.numSlots,
      },
    },
    Save: {
      browser: {
        slot: {
          size: copy.meta.save?.slotsUsed,
        },
      },
      slots: {
        length: copy.meta.save?.numSlots ?? 0,
        count: () => copy.meta.save?.slotsUsed ?? 0,
      },
    },
    State: {
      variables: copy.state,
      passage: copy.initialPassage,
    },
    Story: {
      name: copy.meta.name,
      title: copy.meta.name,
      get ifId() {
        return copy.meta.ifId;
      },
    },
    storage: {
      name: copy.meta.save?.storage ?? 'localStorage',
    },
    version: {
      major: version?.major ?? 2,
      minor: version?.minor ?? 0,
      patch: version?.patch ?? 0,
      build: 0,
      long: () => `SugarCube v${version?.shortStr ?? '2.0.0'}`,
      short: () => version?.shortStr ?? '2.0.0',
      toString: () => version?.shortStr ?? '2.0.0',
    },
  } satisfies Window['SugarCube'];
}
