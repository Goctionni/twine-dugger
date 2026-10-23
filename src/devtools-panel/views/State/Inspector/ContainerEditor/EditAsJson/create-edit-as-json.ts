import { createSignal, type Accessor } from 'solid-js';

import { isContainer } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { createEditStatus } from '../../createEditStatus';
import { createStablePath } from '../../createStablePath';

interface Options {
  containerPath: Accessor<Path>;
  container: Accessor<JSONSafeValue>;
}

/** Whether the container can be edited as JSON, and whether that editor is open instead of the grid */
export function createEditAsJson({ containerPath, container }: Options) {
  const { canChange } = createEditStatus(containerPath);
  const getStablePath = createStablePath(containerPath);

  const [isEditingJson, setIsEditingJson] = createSignal(() => {
    getStablePath(); // Reset isEditingJson when the path changes (The component stays alive during path changes)
    return false;
  });

  const getCantEditReason = () => {
    if (!canChange()) return 'This value is locked, or in a set';
    const value = container();
    const isList = Array.isArray(value);
    if (isList && value.some((item) => isContainer(item))) {
      return 'Only available when all items are primitive values';
    }
    return undefined;
  };

  return { getCantEditReason, isEditingJson, setIsEditingJson };
}
