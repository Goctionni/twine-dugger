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

  const tracker = createUpdateTracker(formatHelper.getRawState);
  const enforceLocks = createLockEnforcer(formatHelper.getRawState, formatHelper.setState);
  let locks: Lock[] = [];
  let initialized = false;

  window.TwineDugger = {
    getUpdates: (full = false): UpdateResult => {
      const passage = formatHelper.getPassage();
      if (full || !initialized) {
        initialized = true;
        return { type: 'init', passage, state: tracker.reset() };
      }

      // Locked values are restored before the state is read, so the changes never show up in the delta
      const reverts = enforceLocks(locks);
      return { type: 'update', passage, delta: tracker.getDelta(), reverts };
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
