import { jsonReplacer, jsonReviver } from '@/shared/json-helper';

import sugarcubeHelpers from './format-helpers/sugarcube';
import harloweHelpers from './format-helpers/harlowe';
import { FormatHelpers } from './format-helpers/type';

const formatHelpers: FormatHelpers[] = [sugarcubeHelpers, harloweHelpers];

function init() {
  const formatHelper = formatHelpers.find((helper) => helper.detect());
  if (!formatHelper) return;

  const differ = formatHelper.getDiffer();
  let lastState = structuredClone(formatHelper.getState(false));
  window.TwineDugger = {
    utils: {
      jsonReplacer,
      jsonReviver,
    },
    getState: () => ({
      passage: formatHelper.getPassage(),
      state: formatHelper.getState(true),
    }),
    getDiffs: () => {
      const newState = formatHelper.getState(false);
      const diffs = differ(lastState, newState);
      lastState = structuredClone(newState);
      return {
        passage: formatHelper.getPassage(),
        diffs,
      };
    },
    setState: (path, value) => {
      return formatHelper.setState(path, value);
    },
  };
}

init();
