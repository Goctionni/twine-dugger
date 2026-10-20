import { createEffect, createSignal } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { registerDraft } from './draft-registry';

/**
 * What is being typed into an editor, for the value at a path. The draft starts as the saved value,
 * and belongs to the value it was typed against: it starts over for another path, and for another
 * value at the path (the game changed it, or the save of the draft arrived). A save that does not get
 * through changes nothing, so the draft stays to try again.
 * The path should only change when it is another path (see `createStablePath`).
 * `normalize` has the last say on what is saved (a number is held to its range).
 */
export function createDraft<T extends number | string>(
  getPath: () => Path,
  normalize: (value: T) => T = (value) => value,
) {
  const getStateValue = () => getPathValue(getLatestState(), getPath()) as T;
  const [getDraft, setDraft] = createSignal(() => getStateValue());

  const isDirty = () => getDraft() !== getStateValue();
  const revert = () => setDraft(() => getStateValue());

  const save = async () => {
    if (!isDirty()) return;
    try {
      await setState(getPath(), normalize(getDraft()));
    } catch (error) {
      console.error('Failed to save the value:', error);
    }
  };

  // Known to the container the value is in, for as long as there is something to save
  createEffect(isDirty, (dirty) => {
    if (dirty) return registerDraft({ path: getPath(), save, revert });
  });

  return {
    getStateValue,
    getDraft,
    setDraft: (value: T) => setDraft(() => value),
    isDirty,
    revert,
    save,
  };
}
