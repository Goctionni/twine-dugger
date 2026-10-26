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
 * `codec` is for a value that is typed as something else than the state has it: `read` makes the
 * text of the value in the state, `write` the value to save from the text (a Date).
 */
export function createDraft<T extends number | string>(
  getPath: () => Path,
  normalize: (value: T) => T = (value) => value,
  codec: { read: (stateValue: T) => T; write: (draft: T) => T } = {
    read: (value) => value,
    write: (value) => value,
  },
) {
  const getStateValue = () => getPathValue(getLatestState(), getPath()) as T;
  const getSavedDraft = () => codec.read(getStateValue());
  const [getDraft, setDraft] = createSignal(() => getSavedDraft());

  const isDirty = () => getDraft() !== getSavedDraft();
  const revert = () => setDraft(() => getSavedDraft());

  const save = async () => {
    if (!isDirty()) return;
    try {
      await setState(getPath(), codec.write(normalize(getDraft())));
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
