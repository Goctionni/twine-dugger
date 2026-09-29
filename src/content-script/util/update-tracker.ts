import type { Delta } from 'jsondiffpatch';
import { create as createDiffer } from 'jsondiffpatch';

import { getObjectId, setupIdentityHasher } from '@/shared/id-helper';
import type { ObjectValue } from '@/shared/shared-types';

import { pretransformState } from './pre-transform';

/** Follows the live state of the game, and tells what changed in it each time it's asked */
export function createUpdateTracker(getLiveState: () => ObjectValue) {
  const { getObjectHash, setIdentitySources } = setupIdentityHasher();

  const differ = createDiffer({
    objectHash: (item, index) => getObjectHash(item) ?? getObjectId(item) ?? `$$index:${index}`,
    arrays: { detectMove: true, includeValueOnMove: false },
  });

  let [oldState, , oldIdentityLookup] = pretransformState(getLiveState());

  return {
    /** The state as it was the last time it was looked at */
    getState: () => oldState,

    /** What changed since the last time it was looked at, if anything did */
    getDelta(): Delta | undefined {
      const [newState, , newIdentityLookup] = pretransformState(getLiveState());
      setIdentitySources({ oldIdentityLookup, newIdentityLookup });

      const delta = differ.diff(oldState, newState);
      oldState = newState;
      oldIdentityLookup = newIdentityLookup;
      return delta;
    },
  };
}
