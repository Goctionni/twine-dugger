import { copy } from '@/shared/copy';
import { jsonReplacer, jsonReviver } from '@/shared/json-helper';
import { UpdateResult } from '@/shared/shared-types';

import harloweHelpers from './format-helpers/harlowe';
import { getPassageData } from './format-helpers/shared';
import sugarcubeHelpers from './format-helpers/sugarcube';
import { FormatHelpers } from './format-helpers/type';

const formatHelpers: FormatHelpers[] = [sugarcubeHelpers, harloweHelpers];

function init() {
  const formatHelper = formatHelpers.find((helper) => helper.detect());
  if (!formatHelper) return;

  const differ = formatHelper.getDiffer();
  let lastState = copy(formatHelper.getState(false));
  window.TwineDugger = {
    utils: {
      jsonReplacer,
      jsonReviver,
    },
    getState: () => ({
      passage: formatHelper.getPassage(),
      state: formatHelper.getState(true),
    }),
    getUpdates: (): UpdateResult => {
      let updates: UpdateResult = { diffPackage: null, locksUpdate: null };
      const newState = formatHelper.getState(false);
      let diffs = differ(lastState, newState);

      // If there are no diffs, return an empty response
      if (!diffs.length) return updates;

      // Process diffs or fallback to noop function
      const processDiffs = formatHelper.processDiffs ?? (() => ({ diffs, locksUpdate: null }));
      const result = processDiffs(diffs);

      // Create a copy of the state
      lastState = copy(newState);

      if (result.diffs.length) {
        updates.diffPackage = {
          passage: formatHelper.getPassage(),
          diffs: result.diffs,
        };
      }
      if (result.locksUpdate) {
        updates.locksUpdate = result.locksUpdate;
      }

      return updates;
    },
    setState: formatHelper.setState,
    deleteFromState: formatHelper.deleteFromState,
    duplicateStateProperty: formatHelper.duplicateStateProperty,
    setStatePropertyLock: formatHelper.setStatePropertyLock,
    getPassageData,
  };
}

init();
