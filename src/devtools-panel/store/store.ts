import { createStore, createMemo, snapshot } from 'solid-js';
import { untrack } from '@solidjs/web'
import { StateDiff, StoreData } from './store-types';
import { create as createDiffer } from 'jsondiffpatch';
import { JSONSafeArray, JSONSafeObject, Path } from '@/shared/shared-types';

const LS_PREFIX = 'twine-dugger-';

const [store, setStore] = createStore<StoreData>({
  connectionState: 'loading-meta',
  candidateIframes: [],
  gameMeta: null,
  gameState: {},
  stateDiffs: [],
  viewState: {
    activeTab: 'state',
    state: {historyRef: 'latest', path: []},
    passage: {selected: null},
    search: {query: '', resultTab: 'state'},
  },
  gameConfig: {filteredPaths: [], lockedPaths: []},
  settings: {
    ['diffLog.fontSize']: 14,
    ['diffLog.pollingInterval']: 200,
    ['diffLog.maxHistorySlices']: 50,
    ['diffLog.headingStyle']: 'default',
    ['state.propertyOrder']: 'type',
    ['state.propertyOrderDesc']: false,
    ['state.filters']: [],
  },
});

const differ = createDiffer();

export function addDiff(diff: StateDiff) {
  setStore((draft) => {
    draft.stateDiffs.push(diff);
    differ.patch(draft.gameState, diff.delta);
  });
}

const historySlice = createMemo(() => {
  const historyRef = store.viewState.state.historyRef;
  if (historyRef === 'latest') return null;

  return untrack(() => {
    const state = structuredClone(snapshot(store.gameState));
    const diffs = store.stateDiffs.toReversed();
    for (const diff of diffs) {
      if (diff.id === historyRef) return state;
      differ.unpatch(state, diff.delta);
    }
    return state;
  })
});
export function getHistorySlice() {
  return historySlice() ?? store.gameState;
}

export const getHistorySlices = createMemo(() => store.stateDiffs.map((diff, index) => ({
  id: diff.id,
  linkTo: index === 0 ? 'latest' : diff.id,
  text: index === 0 ? 'latest' : `-${index}`,
})));



export const getObjectNavPaths = createMemo<Path[]>((prev) => {
  let hasChanges = false;
  // let parentState = store.
  const fullpath = store.viewState.state.path;
  const rootColumn: ObjectNavColumn = {
    // slug
  }
  const columns: ObjectNavColumn[] = [];
  for (let i = 0; i < fullpath.length; i++) {
    const slug = fullpath[i];

  }
})


// getObjectRefs, uses historyRef en path
function getObjectRefs = createMemo(() => {
  const historyRefs = store.viewState.state.historyRef;
  const path = store.viewState.state.path;
  
})