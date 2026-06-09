import { type } from 'arktype';

import type {
  FormatPassage,
  HarloweGlobals,
  HarloweGlobalsMacroFramework,
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
  __HarloweInternals: {
    state: { variables: 'object' },
    engine: 'object',
  },
} as type.cast<HarloweGlobals>).or({
  Harlowe: {
    API_ACCESS: 'object',
  },
} as type.cast<HarloweGlobalsMacroFramework>);

const harlowe = (): HarloweGlobals['__HarloweInternals'] => {
  const scope = harloweSchema.assert(window);
  if ('__HarloweInternals' in scope) {
    return scope.__HarloweInternals;
  }
  return {
    state: scope.Harlowe.API_ACCESS.STATE,
    engine: scope.Harlowe.API_ACCESS.ENGINE,
    passages: scope.Harlowe.API_ACCESS.PASSAGES,
  };
};

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
const getBaseState = () => harlowe().state.variables;
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
  getPassage: () => harlowe().state.passage,
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => harlowe().engine.goToPassage(passageName),
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
  const Passages = harlowe().passages;
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
