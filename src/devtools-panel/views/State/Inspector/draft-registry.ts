import { createSignal } from 'solid-js';

import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

export interface UnsavedDraft {
  path: Path;
  save: () => Promise<void>;
  revert: () => void;
}

// The editors that have something typed that is not saved, so that a container can save or drop
// what is typed in all of its fields at once
const [getDrafts, setDrafts] = createSignal<readonly UnsavedDraft[]>([]);

/** Returns what takes the draft out again */
export function registerDraft(draft: UnsavedDraft) {
  setDrafts((drafts) => [...drafts, draft]);
  return () => setDrafts((drafts) => drafts.filter((current) => current !== draft));
}

const getChildDrafts = (parent: Path) =>
  getDrafts().filter((draft) => pathEquals(draft.path.slice(0, -1), parent));

export const countUnsavedChildren = (parent: Path) => getChildDrafts(parent).length;

/** The keys of the children that have something typed that is not saved */
export const getUnsavedChildKeys = (parent: Path) =>
  getChildDrafts(parent).map((draft) => draft.path.at(-1)!);

export const saveChildDrafts = (parent: Path) =>
  Promise.all(getChildDrafts(parent).map((draft) => draft.save()));

export function discardChildDrafts(parent: Path) {
  for (const draft of getChildDrafts(parent)) draft.revert();
}
