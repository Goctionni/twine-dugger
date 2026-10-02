import { type } from 'arktype';

import type { FormatPassage, Path, SnowmanGlobals } from '@/shared/shared-types';

import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import type { FormatHelpers } from './type';

const passageSchema = type({
  id: 'number',
  name: 'string',
  source: 'string',
  tags: 'string[]',
});

const snowmanSchema = type({
  story: {
    name: 'string',
    startPassage: 'number',
    creator: 'string',
    creatorVersion: 'string',
    history: 'number[]',
    state: 'object',
    passages: passageSchema.or('undefined').array(),
    show: 'Function',
  },
  passage: passageSchema,
} as type.cast<SnowmanGlobals>);

const snowman = () => snowmanSchema.assert(window);

const getState = () => snowman().story.state;
const setState = (path: Path, value: unknown) => setStateBase(getState(), path, value);

export default {
  detect: () => {
    return (
      snowmanSchema.allows(window) && !!document.querySelector('tw-storydata > tw-passagedata')
    );
  },
  getState,
  getPassage: () => snowman().passage.name,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) => {
    duplicateStateProperty(getState(), parentPath, sourceKey, targetKey);
  },
  deleteFromState: (path) => deleteFromState(getState(), path),
  goToPassage: (passageName) => snowman().story.show(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function createOrUpdatePassage({ name, source, tags }: FormatPassage) {
  const passages = snowman().story.passages;
  const passage = passages.find((item) => item?.name === name);
  if (!passage) {
    const maxId = Math.max(...passages.map((item) => item?.id ?? 0));
    passages.push({ id: maxId + 1, name, source, tags: tags ?? [] });
  } else {
    passage.source = source;
    if (tags) passage.tags = tags;
  }
}
