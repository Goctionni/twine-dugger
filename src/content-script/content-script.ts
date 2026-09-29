import { create as createDiffer } from 'jsondiffpatch';

import { getObjectId, setupIdentityHasher } from '@/shared/id-helper';
import type { Lock, UpdateResult } from '@/shared/shared-types';

import chapbookHelpers from './format-helpers/chapbook';
import harloweHelpers from './format-helpers/harlowe';
import { getPassageData } from './format-helpers/shared';
import snowmanHelpers from './format-helpers/snowman';
import sugarcubeHelpers from './format-helpers/sugarcube';
import type { FormatHelpers } from './format-helpers/type';
import { enforceLocks } from './util/locks';
import { pretransformState } from './util/pre-transform';

const formatHelpers: FormatHelpers[] = [
  sugarcubeHelpers,
  harloweHelpers,
  chapbookHelpers,
  snowmanHelpers,
];

function init() {
  if (window.TwineDugger) return;
  const formatHelper = formatHelpers.find((helper) => helper.detect());
  if (!formatHelper) return;

  const { getObjectHash, setIdentitySources } = setupIdentityHasher();

  const differ = createDiffer({
    objectHash: (item, index) => getObjectHash(item) ?? getObjectId(item) ?? `$$index:${index}`,
    arrays: { detectMove: true, includeValueOnMove: false },
  });

  let [oldState, , oldIdentityLookup] = pretransformState(formatHelper.getState());
  let locks: Lock[] = [];
  // Set until the panel has been told (by `getState` or `getUpdates`) that we just started
  let initialized = true;

  window.TwineDugger = {
    getState: () => {
      initialized = false;
      return { passage: formatHelper.getPassage(), state: oldState };
    },
    getUpdates: (): UpdateResult => {
      // Locked values are restored before the state is read, so the changes never show up in the delta
      const reverts = enforceLocks(locks, formatHelper.getState, formatHelper.setState);

      const [newState, , newIdentityLookup] = pretransformState(formatHelper.getState());
      setIdentitySources({ oldIdentityLookup, newIdentityLookup });

      const delta = differ.diff(oldState, newState);
      oldState = newState;
      oldIdentityLookup = newIdentityLookup;

      const result = { passage: formatHelper.getPassage(), delta, reverts, initialized };
      initialized = false;
      return result;
    },
    setState: formatHelper.setState,
    deleteFromState: formatHelper.deleteFromState,
    duplicateStateProperty: formatHelper.duplicateStateProperty,
    setStatePropertyLocks: (newLocks) => {
      locks = newLocks;
    },
    getPassageData: formatHelper.getPassageData ?? getPassageData,
    goToPassage: formatHelper.goToPassage,
    setPassage: formatHelper.setPassage,
  };
}

init();
