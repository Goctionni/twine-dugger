import { type } from 'arktype';

import type { FormatPassage, ObjectValue, Path } from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
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
    state: 'object' as type.cast<ObjectValue>,
    passages: passageSchema.or('undefined').array(),
    show: 'Function' as type.cast<(name: string) => void>,
  },
  passage: passageSchema,
});

const snowman = () => snowmanSchema.assert(window);

const getState = () => snowman().story.state;
const setState = (path: Path, value: unknown) => setStateBase(getState(), path, value);

const { processDiffs, setPathLock } = createPropertyLocker(getState, setState);

export default {
  getDiffer: () => getDifferBase(),
  detect: () =>
    snowmanSchema.allows(window) && !!document.querySelector('tw-storydata > tw-passagedata'),
  getState,
  getPassage: () => snowman().passage.name,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getState(), path),
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
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
