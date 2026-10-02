import { type } from 'arktype';

import type { FormatPassage, Path, SugarCubeGlobals } from '@/shared/shared-types';

import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
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

const getRawState = () => sugarcube().State.variables;
const setState = (path: Path, value: unknown) => setStateBase(getRawState(), path, value);

export default {
  detect: () => sugarCubeSchema.allows(window),
  getRawState,
  getPassage: () => sugarcube().State.passage,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) => {
    duplicateStateProperty(getRawState(), parentPath, sourceKey, targetKey);
  },
  deleteFromState: (path) => deleteFromState(getRawState(), path),
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
