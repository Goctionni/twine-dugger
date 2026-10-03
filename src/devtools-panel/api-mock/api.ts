import type { FormatPassage, Lock, Path } from '@/shared/shared-types';

import type * as T from '../api/api';

type Api = typeof T;

type Return<K extends keyof Api> = ReturnType<Api[K]>;

export async function getGameMetaData(): Return<'getGameMetaData'> {
  return Promise.resolve({
    ifId: '1234',
    name: 'mock name',
    compiler: {
      name: 'cow',
      version: '1.0',
    },
    format: {
      name: 'SugarCube',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
        shortStr: '1.0.0',
      },
    },
    passages: {
      start: 'my-first-passage',
      count: 5,
    },
    save: {
      numSlots: 3,
      slotsUsed: 1,
      storage: '',
      storageCapacity: 1,
      storageUsed: 0,
      storageUsedPct: 0,
    },
    settings: {
      historyControls: true,
      historyMax: 10,
    },
  });
}

export async function getUpdates(full = false): Return<'getUpdates'> {
  if (full) {
    return Promise.resolve({ type: 'init', passage: '', state: { test: 123, example: 'test' } });
  }
  return Promise.resolve({ type: 'update', passage: '', delta: undefined, reverts: [] });
}

export async function setState(_path: Array<string | number>, _value: unknown): Return<'setState'> {
  return Promise.resolve();
}

export async function setStatePropertyLocks(_locks: Lock[]): Return<'setStatePropertyLocks'> {
  return Promise.resolve();
}

export async function duplicateStateProperty(
  _parentPath: Path,
  _sourceKey: string | number,
  _targetKey?: string,
): Return<'duplicateStateProperty'> {
  return Promise.resolve();
}

export async function deleteFromState(_path: Array<string | number>): Return<'deleteFromState'> {
  return Promise.resolve();
}

export async function getPassageData(): Return<'getPassageData'> {
  return Promise.resolve([]);
}

export async function gotoUrl(_url: string): Return<'gotoUrl'> {
  return Promise.resolve(null);
}

export async function goToPassage(_passageName: string): Return<'goToPassage'> {
  return Promise.resolve();
}

export async function setPassage(_passage: FormatPassage): Return<'setPassage'> {
  return Promise.resolve();
}
