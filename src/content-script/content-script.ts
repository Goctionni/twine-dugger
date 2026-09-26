import type { Delta } from 'jsondiffpatch';
import { create as createDiffer } from 'jsondiffpatch';

import { getObjectId, setupIdentityHasher } from '@/shared/id-helper';

import chapbookHelpers from './format-helpers/chapbook';
import harloweHelpers from './format-helpers/harlowe';
import { getPassageData } from './format-helpers/shared';
import snowmanHelpers from './format-helpers/snowman';
import sugarcubeHelpers from './format-helpers/sugarcube';
import type { FormatHelpers } from './format-helpers/type';
import { pretransformState } from './util/pre-transform';

const formatHelpers: FormatHelpers[] = [
  sugarcubeHelpers,
  harloweHelpers,
  chapbookHelpers,
  snowmanHelpers,
];

function init() {
  const formatHelper = formatHelpers.find((helper) => helper.detect());
  if (!formatHelper) return;

  const { getObjectHash, setIdentitySources } = setupIdentityHasher();

  const differ = createDiffer({
    objectHash: (item, index) => getObjectHash(item) ?? getObjectId(item) ?? `$$index:${index}`,
    arrays: { detectMove: true, includeValueOnMove: false },
  });

  let [oldState, , oldIdentityLookup] = pretransformState(formatHelper.getState());

  window.TwineDugger = {
    getState: () => ({
      passage: formatHelper.getPassage(),
      state: oldState,
    }),
    getUpdates: (): Delta => {
      const [newState, newIdentityCache, newIdentityLookup] = pretransformState(
        formatHelper.getState(),
      );
      setIdentitySources({ oldIdentityLookup: oldIdentityLookup, newIdentityCache });

      const delta = differ.diff(oldState, newState);
      oldState = newState;
      oldIdentityLookup = newIdentityLookup;

      // TODO: Add locks back in

      return delta;
    },
    setState: formatHelper.setState,
    deleteFromState: formatHelper.deleteFromState,
    duplicateStateProperty: formatHelper.duplicateStateProperty,
    setStatePropertyLock: formatHelper.setStatePropertyLock,
    setStatePropertyLocks: formatHelper.setStatePropertyLocks,
    getPassageData: formatHelper.getPassageData ?? getPassageData,
    goToPassage: formatHelper.goToPassage,
    setPassage: formatHelper.setPassage,
  };
}

init();
