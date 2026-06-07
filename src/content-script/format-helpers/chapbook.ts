import { type } from 'arktype';

import type { FormatPassage, ObjectValue, Path, Value } from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { createPropertyLocker } from './sharedPropertyLocker';
import type { FormatHelpers } from './type';

type Fn<T> = type.cast<T>;
type Get<T> = Fn<() => T>;
type Set<T> = Fn<(obj: T) => void>;

const passageSchema = type({
  id: 'number',
  name: 'string',
  source: 'string',
  tags: 'string[]',
});

const chapbookSchema = type({
  engine: {
    state: {
      get: 'Function' as Fn<(path: string) => Value>,
      set: 'Function' as Fn<(path: string, value: unknown) => void>,
      saveToObject: 'Function' as Get<ObjectValue>,
      restoreFromObject: 'Function' as Set<ObjectValue>,
    },
    story: {
      ifid: 'Function' as Get<string>,
      name: 'Function' as Get<string>,
      passages: 'Function' as Get<(typeof passageSchema.infer)[]>,
      startPassage: 'Function' as Get<typeof passageSchema.infer>,
    },
  },
  go: 'Function' as Fn<(name: string) => void>,
  restart: 'Function',
});

const chapbook = () => chapbookSchema.assert(window);

const getState = () => chapbook().engine.state.saveToObject();
const setState = (path: Path, value: unknown) => chapbook().engine.state.set(path.join('.'), value);

const { processDiffs, setPathLock } = createPropertyLocker(getState, setState);

export default {
  getDiffer: () => getDifferBase(),
  detect: () =>
    chapbookSchema.allows(window) && !!document.querySelector('tw-storydata > tw-passagedata'),
  getState,
  getPassage: () => chapbook().engine.state.get('passage.name') as string,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) => {
    console.log('duplicateStateProperty', parentPath, sourceKey, targetKey);
    const currentValue: Value = chapbook().engine.state.get([...parentPath, sourceKey].join('.'));
    if (targetKey === null && parentPath.length) {
      // For arrays the target key is null
      const parentValue = chapbook().engine.state.get(parentPath.join('.'));
      if (parentValue && Array.isArray(parentValue)) {
        chapbook().engine.state.set(parentPath.join('.'), [
          ...parentValue,
          structuredClone(currentValue),
        ]);
      }
    } else {
      chapbook().engine.state.set(
        [...parentPath, targetKey].join('.'),
        structuredClone(currentValue),
      );
    }
  },
  deleteFromState: (path) => {
    const deleteKey = path.at(-1)!;
    if (typeof deleteKey !== 'string' && typeof deleteKey !== 'number') {
      return console.error(
        `[Twine Dugger]: Could not delete at path. Delete key must be a number or string.`,
      );
    }
    const parentPath = path.slice(0, -1);
    // If root value
    if (!parentPath.length) {
      const state = getState();
      const copy = { ...state };
      delete copy[deleteKey];
      chapbook().engine.state.restoreFromObject(copy);
      return;
    }

    // If not a root value
    const parentValue: Value = chapbook().engine.state.get(parentPath.join('.'));
    if (!parentValue || typeof parentValue !== 'object') {
      return console.error(
        `[Twine Dugger]: Could not delete at path. Parent does not appear to be an object.`,
      );
    }
    if (Array.isArray(parentValue)) {
      const deleteIndex = Number(deleteKey);
      const newArray = parentValue.toSpliced(deleteIndex, 1);
      chapbook().engine.state.set(parentPath.join('.'), newArray);
    } else if (parentValue instanceof Map) {
      const newMap = new Map(parentValue);
      newMap.delete(deleteKey);
      chapbook().engine.state.set(parentPath.join('.'), newMap);
    } else if (parentValue instanceof Set) {
      const newSet = new Set(parentValue);
      newSet.delete(deleteKey);
      chapbook().engine.state.set(parentPath.join('.'), newSet);
    } else {
      const newObj: Record<string, unknown> = { ...parentValue };
      delete newObj[deleteKey];
      chapbook().engine.state.set(parentPath.join('.'), newObj);
    }
  },
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => chapbook().go(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function createOrUpdatePassage({ name, source, tags }: FormatPassage) {
  const passages = chapbook().engine.story.passages();
  const passage = passages.find((item) => item.name === name);
  if (!passage) {
    const maxId = Math.max(...passages.map((passage) => passage.id));
    passages.push({ id: maxId + 1, name, source, tags: tags ?? [] });
  } else {
    passage.source = source;
    if (tags) passage.tags = tags;
  }
}
