import { type } from 'arktype';

import type { FormatPassage, Path } from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { deleteFromState, duplicateStateProperty } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
import type { FormatHelpers } from './type';

const chapbookSchema = type({
  engine: {
    state: {
      get: 'Function',
      set: 'Function',
      saveToObject: 'Function',
    },
    story: {
      ifid: 'Function',
      name: 'Function',
      passages: 'Function',
      startPassage: 'Function',
    },
  },
  go: 'Function',
  restart: 'Function',
});

const getState = () => window.engine.state.saveToObject();
const setState = (path: Path, value: unknown) => window.engine.state.set(path.join('.'), value);

const { processDiffs, setPathLock } = createPropertyLocker(getState, setState);

// TODO: replace duplicateStateProperty
// TODO: replace deleteFromState

export default {
  getDiffer: () => getDifferBase(),
  detect: () =>
    chapbookSchema.allows(window) && !!document.querySelector('tw-storydata > tw-passagedata'),
  getState,
  getPassage: () => window.engine.state.get('passage.name') as string,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getState(), path),
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => window.go(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function createOrUpdatePassage({ name, source, tags }: FormatPassage) {
  const passages = window.engine.story.passages();
  const passage = passages.find((item) => item.name === name);
  if (!passage) {
    const maxId = Math.max(...passages.map((passage) => passage.id));
    passages.push({ id: maxId + 1, name, source, tags: tags ?? [] });
  } else {
    passage.source = source;
    if (tags) passage.tags = tags;
  }
}
