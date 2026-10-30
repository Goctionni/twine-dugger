import { createMemo, createSignal } from 'solid-js';

import { setStateMulti } from '@/devtools-panel/api/api';
import { SET_MARKER, type ContainerType } from '@/shared/json-safe';
import type { JSONSafeObject, JSONSafeValue, Path, Write } from '@/shared/shared-types';

import { compareJson } from './compare-json';

interface Options {
  getPath: () => Path;
  getContainer: () => JSONSafeValue;
  getContainerType: () => ContainerType;
  /** The properties that are in the text */
  getKeysInEdit: () => readonly string[];
  isLocked: (key: string | number) => boolean;
  /** Called when what was typed is written */
  onSaved: () => void;
}

/**
 * The JSON text of the container as it is typed, what it changes, whether that can be saved, and the
 * save. What is saved is the difference between the text and what the container holds now.
 */
export function createJsonDraft(options: Options) {
  const { getPath, getContainer, getContainerType, getKeysInEdit, isLocked, onSaved } = options;

  const [getEditedText, setEditedText] = createSignal<string>();
  const [isSaving, setSaving] = createSignal(false);

  // Until something is typed, the text follows the container
  const getGeneratedText = createMemo(() => {
    const container = getContainer();
    if (getContainerType() === 'array') return JSON.stringify(container, null, 2);
    if (getContainerType() === 'set') {
      return JSON.stringify((container as JSONSafeValue[]).slice(1), null, 2);
    }
    const properties = container as JSONSafeObject;
    const edited = Object.fromEntries(getKeysInEdit().map((key) => [key, properties[key]]));
    return JSON.stringify(edited, null, 2);
  });
  const getText = () => getEditedText() ?? getGeneratedText();
  const isEdited = () => getText() !== getGeneratedText();

  const getComparison = createMemo(() =>
    compareJson(getContainerType(), getContainer(), getKeysInEdit(), getText()),
  );

  const getLockedChanges = () => getComparison().changes.filter((change) => isLocked(change.key));
  const getProblem = () => {
    if (getComparison().error) return getComparison().error;
    if (getLockedChanges().length === 0) return undefined;
    return 'Locked properties cannot be changed. See list of changes for details';
  };
  // The ones that block saving come first
  const getListedChanges = () => [
    ...getLockedChanges(),
    ...getComparison().changes.filter((change) => !isLocked(change.key)),
  ];

  const save = async () => {
    if (getProblem() || isSaving()) return;
    setSaving(true);
    try {
      const { changes } = getComparison();
      if (getContainerType() === 'set') {
        // The items of a set have no place to write to: the whole set is written
        const items = JSON.parse(getText()) as JSONSafeValue[];
        if (changes.length > 0)
          await setStateMulti([{ path: getPath(), value: [SET_MARKER, ...items] }]);
      } else {
        // Writes first, then the deletes: the changes of an array list its deletes from the last.
        // A container that is written holds Maps, Sets and Dates of its own: they are restored too
        const writes = changes
          .filter((change) => change.op !== 'delete')
          .map((change): Write => ({
            path: [...getPath(), change.key],
            value: change.after!,
            deep: typeof change.after === 'object' && change.after !== null,
          }));
        const deletes = changes
          .filter((change) => change.op === 'delete')
          .map((change): Write => ({ path: [...getPath(), change.key], delete: true }));
        await setStateMulti([...writes, ...deletes]);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return {
    getText,
    setEditedText,
    isEdited,
    getComparison,
    getProblem,
    getListedChanges,
    isSaving,
    save,
  };
}
