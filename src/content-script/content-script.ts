import type { Lock, UpdateResult } from '@/shared/shared-types';

import chapbookHelpers from './format-helpers/chapbook';
import harloweHelpers from './format-helpers/harlowe';
import { getPassageData } from './format-helpers/shared';
import snowmanHelpers from './format-helpers/snowman';
import sugarcubeHelpers from './format-helpers/sugarcube';
import type { FormatHelpers } from './format-helpers/type';
import { createLockEnforcer } from './util/locks';
import { createUpdateTracker } from './util/update-tracker';

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

  const tracker = createUpdateTracker(formatHelper.getState);
  const enforceLocks = createLockEnforcer(formatHelper.getState, formatHelper.setState);
  let locks: Lock[] = [];
  // Set until the panel has been told (by `getState` or `getUpdates`) that we just started
  let initialized = true;

  window.TwineDugger = {
    getState: () => {
      initialized = false;
      return { passage: formatHelper.getPassage(), state: tracker.getState() };
    },
    getUpdates: (): UpdateResult => {
      // Locked values are restored before the state is read, so the changes never show up in the delta
      const reverts = enforceLocks(locks);

      const delta = tracker.getDelta();
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
