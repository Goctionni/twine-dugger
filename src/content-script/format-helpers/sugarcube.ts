import { type } from 'arktype';

import type { FormatPassage, Path, SugarCubeGlobals } from '@/shared/shared-types';

import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
import type { FormatHelpers } from './type';

const sugarCubeSchema = type({
  SugarCube: {
    State: {
      variables: 'object',
      passage: 'string',
    },
    Engine: {
      play: 'Function',
    },
    Story: {
      ifId: 'string',
    },
  } as type.cast<SugarCubeGlobals['SugarCube']>,
});

const sugarcube = () => sugarCubeSchema.assert(window).SugarCube;

const getState = () => sugarcube().State.variables;
const setState = (path: Path, value: unknown) => setStateBase(getState(), path, value);

const { processDiffs, setPathLock } = createPropertyLocker(getState, setState);

export default {
  detect: () => sugarCubeSchema.allows(window),
  getState,
  getPassage: () => sugarcube().State.passage,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getState(), path),
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => sugarcube().Engine.play(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function createOrUpdatePassage({ name, source, tags }: FormatPassage) {
  const storyAPI = sugarcube().Story;
  if (storyAPI.has(name)) {
    const passage = storyAPI.get(name);
    passage.element!.textContent = source;
    if (tags) {
      passage.tags = tags;
      passage.element!.setAttribute('tags', tags.join(' '));
    }
  } else {
    storyAPI.add({
      name: name,
      text: source,
      tags: tags ?? [],
    });
  }
}
