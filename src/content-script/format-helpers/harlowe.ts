import { type } from 'arktype';

import type {
  FormatPassage,
  HarloweGlobals,
  HarloweGlobalsMacroFramework,
  PassageData,
  Path,
} from '@/shared/shared-types';

import {
  deleteFromState,
  duplicateStateProperty,
  setState as setStateBase,
  getPassageData as getPassageDataBase,
} from './shared';
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

const detect = () => harloweSchema.allows(window);
const getState = () => harlowe().state.variables;
const setState = (path: Path, value: unknown) => setStateBase(getState(), path, value);
const { processDiffs, setPathLock } = createPropertyLocker(getState, setState);

export default {
  detect,
  getState,
  setState,
  duplicateStateProperty: (parentPath, sourceKey, targetKey) =>
    duplicateStateProperty(getState(), parentPath, sourceKey, targetKey),
  deleteFromState: (path) => deleteFromState(getState(), path),
  getPassage: () => harlowe().state.passage,
  setStatePropertyLock: setPathLock,
  setStatePropertyLocks: (paths) => paths.forEach((path) => setPathLock(path, true)),
  processDiffs,
  goToPassage: (passageName) => harlowe().engine.goToPassage(passageName),
  setPassage: (passage) => createOrUpdatePassage(passage),
  getPassageData,
} satisfies FormatHelpers;

function getPassageData(): PassageData[] {
  const passages = getPassageDataBase();
  if (passages.length) return passages;

  const passageValues = harlowe().passages?.values?.();
  if (!passageValues) return passages;

  return [...passageValues].map((map, index): PassageData => ({
    pid: `${index}`,
    content: map.get('source')!,
    name: map.get('name')!,
    tags: (map.get('tags') as unknown as string[]).join(', '),
    position: '',
    size: '',
  }));
}

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
