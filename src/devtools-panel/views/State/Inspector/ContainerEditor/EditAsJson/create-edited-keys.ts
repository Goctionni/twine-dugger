import { createMemo, createSignal } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths } from '@/devtools-panel/store/locks';
import { sameItems } from '@/devtools-panel/utils/same-items';
import {
  getContainerKeys,
  getContainerSize,
  getJsonType,
  getPathValue,
  isContainer,
  type ContainerType,
} from '@/shared/json-safe';
import { pathStartsWith } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

interface Props {
  path: Path;
  /** Selected in the grid. Some (not all) of the primitive properties: only those are edited */
  selectedKeys: readonly (string | number)[];
}

/**
 * Which properties of the container are in the JSON text: the selected ones (when that is some of
 * the primitive ones), else the primitive ones, and the container ones too if asked for. Lists have
 * all their items. And what the editor says about the ones that are not.
 */
export function createEditedKeys(props: Props) {
  const getContainer = () => getPathValue(getLatestState(), props.path);
  const getContainerType = () => getJsonType(getContainer()) as ContainerType;
  const isList = () => getContainerType() === 'array' || getContainerType() === 'set';

  const [includeContainers, setIncludeContainers] = createSignal(false);

  const getAllKeys = createMemo(
    () => (isList() ? [] : getContainerKeys(getContainer(), getContainerType()).map(String)),
    { equals: sameItems },
  );
  const getPrimitiveKeys = createMemo(
    () => getAllKeys().filter((key) => !isContainer((getContainer() as JSONSafeObject)[key])),
    { equals: sameItems },
  );
  const getSelectedKeys = () =>
    getPrimitiveKeys().filter((key) => props.selectedKeys.map(String).includes(key));
  // All of them selected is the same as none
  const isEditingSelection = () =>
    getSelectedKeys().length > 0 && getSelectedKeys().length < getPrimitiveKeys().length;
  // A key is locked when its value, or a value above or beneath it, is
  const isLocked = (key: string | number) => {
    const path = [...props.path, key];
    return getLockedPaths().some(
      (locked) => pathStartsWith(path, locked) || pathStartsWith(locked, path),
    );
  };
  const getCandidateKeys = () => (includeContainers() ? getAllKeys() : getPrimitiveKeys());
  // A selection with a locked property can not be edited as JSON, so the selection has none.
  // Locked properties can not be changed, so they are left out of the text.
  const getKeysInEdit = () =>
    isEditingSelection() ? getSelectedKeys() : getCandidateKeys().filter((key) => !isLocked(key));
  const getLockedCount = () =>
    isEditingSelection() ? 0 : getCandidateKeys().filter(isLocked).length;
  const getContainerPropertyCount = () => getAllKeys().length - getPrimitiveKeys().length;
  const hasContainerChoice = () =>
    !isList() && !isEditingSelection() && getContainerPropertyCount() > 0;

  const getScopeText = () => {
    if (getContainerType() === 'set') {
      return `all ${getContainerSize(getContainer() as JSONSafeValue[])} items (the set is shown as an array)`;
    }
    if (isList()) return `all ${getContainerSize(getContainer() as JSONSafeValue[])} items`;
    if (isEditingSelection()) return `${getSelectedKeys().length} selected properties`;
    return getLockedCount() > 0 ? 'all unlocked properties' : 'all properties';
  };

  return {
    getContainer,
    getContainerType,
    includeContainers,
    setIncludeContainers,
    getKeysInEdit,
    isLocked,
    getLockedCount,
    getContainerPropertyCount,
    hasContainerChoice,
    getScopeText,
  };
}
