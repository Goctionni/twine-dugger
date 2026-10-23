import { createSignal, type Accessor } from 'solid-js';

import { getLockedPaths } from '@/devtools-panel/store/locks';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { isContainer } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { createEditStatus } from '../../createEditStatus';
import { getLockStatus } from '../../logic/edit-status';

interface Options {
  containerPath: Accessor<Path>;
  container: Accessor<JSONSafeValue>;
  selectedKeys: Accessor<ReadonlySet<string | number>>;
}

/** Whether the container can be edited as JSON, and whether that editor is open instead of the grid */
export function createEditAsJson({ containerPath, container, selectedKeys }: Options) {
  const { canChange } = createEditStatus(containerPath);
  const getStablePath = createStablePath(containerPath);

  const [isEditingJson, setIsEditingJson] = createSignal(() => {
    getStablePath(); // Reset isEditingJson when the path changes (The component stays alive during path changes)
    return false;
  });

  const getCantEditReason = () => {
    if (!canChange()) return 'This value is locked, or in a set';
    const hasLockedSelection = [...selectedKeys()].some(
      (key) => getLockStatus([...containerPath(), key], getLockedPaths()) !== 'unlocked',
    );
    if (hasLockedSelection) return 'Some of the selected properties are locked';
    const value = container();
    const isList = Array.isArray(value);
    if (isList && value.some((item) => isContainer(item))) {
      return 'Only available when all items are primitive values';
    }
    return undefined;
  };

  return { getCantEditReason, isEditingJson, setIsEditingJson };
}
