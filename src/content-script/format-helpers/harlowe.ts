import { type } from 'arktype';

import type {
  FormatPassage,
  HarloweGlobals,
  ObjectValue,
  Path,
  Value,
} from '@/shared/shared-types';

import { getDiffer as getDifferBase } from '../util/differ';
import { isObj } from '../util/type-helpers';
import { deleteFromState, duplicateStateProperty, setState as setStateBase } from './shared';
import { createPropertyLocker } from './sharedPropertyLocker';
import type { FormatHelpers } from './type';

const harloweSchema = type({
  Harlowe: {
    API_ACCESS: {
      STATE: {
        variables: 'object',
      },
      ENGINE: 'object',
    },
  },
} as type.cast<HarloweGlobals>);

const harlowe = () => harloweSchema.assert(window).Harlowe;

function sanitize(obj: ObjectValue) {
  const result: ObjectValue = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('TwineScript_')) continue;
    if (isObj(value) && Object.keys(value).some((subkey) => subkey.startsWith('TwineScript_')))
      continue;
    result[key] = value;
  }
  return result;
}

function ignoreCheck(key: unknown, value: Value) {
  if (typeof key === 'string' && key.startsWith('TwineScript_')) return true;
  if (
    value &&
    typeof value === 'object' &&
    Object.keys(value).some((key) => key.startsWith('TwineScript_'))
  ) {
    return true;
  }
  return false;
}

const detect = () => harloweSchema.allows(window);
const getBaseState = () => harlowe().API_ACCESS.STATE.variables;
const setState = (path: Path, value: unknown) => setStateBase(getBaseState(), path, value);
const { processDiffs, setPathLock } = createPropertyLocker(getBaseState, setState);

export default {
  detect,
  getState: () => sanitize(getBaseState()),
  getDiffer: () => getDifferBase(ignoreCheck),
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getBaseState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getBaseState(), path),
  getPassage: () => harlowe().API_ACCESS.STATE.passage,
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => harlowe().API_ACCESS.ENGINE.goToPassage(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
} satisfies FormatHelpers;

function getPassageEl(passage: FormatPassage) {
  return document.querySelector<HTMLElement>(`tw-storydata tw-passagedata[name="${passage.name}"]`);
}

function createPassageEl(passage: FormatPassage) {
  const el = document.createElement('tw-passagedata');
  el.setAttribute('name', passage.name);
  document.querySelector('tw-storydata')?.appendChild(el);
  return el;
}

function createOrUpdatePassage(passage: FormatPassage) {
  const Passages = harlowe().API_ACCESS.PASSAGES;
  if (!Passages) {
    alert('API_ACCESS.PASSAGES is not available in this version');
    return;
  }

  const el = getPassageEl(passage) ?? createPassageEl(passage);
  el.textContent = passage.source;
  if (passage.tags) el.setAttribute('tags', passage.tags.join(' '));
  if (passage.position) el.setAttribute('position', passage.position.join(','));
  if (passage.size) el.setAttribute('size', passage.size.join(','));

  const passageEl = Object.assign(el, {
    attr: (attrName: string) => el.getAttribute(attrName),
    html: () => el.innerHTML,
  });

  Passages.clearTreeCache();
  Passages.clearStoryletCache();
  Passages.clearTagCache?.();

  const Passage = Passages.create(passageEl);
  Passages.set(passage.name, Passage);
}
