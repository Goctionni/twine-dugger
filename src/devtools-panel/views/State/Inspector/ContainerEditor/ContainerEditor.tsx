import { Show, createMemo } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import {
  getContainerKeys,
  getContainerSize,
  getJsonType,
  getPathValue,
  isContainer,
} from '@/shared/json-safe';
import type { JSONSafeObject, Path } from '@/shared/shared-types';

import { createEditStatus } from '../createEditStatus';
import { ValueHeader } from '../ValueHeader/ValueHeader';
import { getAddition, getDefaultType, type AddTarget } from './add-property';
import { showAddDialog } from './AddPropertyDialog';
import { PropertyGrid } from './PropertyGrid';

interface Props {
  path: Path;
}

const buttonClass =
  'cursor-pointer rounded-md border border-gray-500 px-3 py-1 text-sm hover:bg-gray-700 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent';

export function ContainerEditor(props: Props) {
  const getContainer = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getContainer()));
  const getCount = () => {
    const container = getContainer();
    return isContainer(container) ? getContainerSize(container) : 0;
  };

  // The items of a set have no place to be named, so nothing is added to one from here
  const getTarget = (): AddTarget | undefined => {
    const type = getType();
    return type === 'object' || type === 'map' || type === 'array' ? type : undefined;
  };
  const { canDelete: canChange } = createEditStatus(() => props.path);

  const add = async () => {
    const target = getTarget();
    if (!target) return;
    const container = getContainer() as JSONSafeObject;
    const keys = getContainerKeys(container, target);
    const added = await showAddDialog({
      target,
      existingKeys: keys,
      defaultType: getDefaultType(keys.map((key) => getJsonType(container[key]))),
    });
    if (!added) return;
    const { path, value } = getAddition(props.path, target, getCount(), added);
    await setState(path, value);
  };

  return (
    <div class="flex flex-col gap-3 p-3">
      <ValueHeader path={props.path}>
        <p class="text-xs text-gray-400">
          {getCount()} {getCount() === 1 ? 'entry' : 'entries'}
        </p>
      </ValueHeader>
      <div class="flex flex-wrap gap-2">
        <Show when={getTarget()}>
          <button
            type="button"
            class={buttonClass}
            disabled={!canChange()}
            title={canChange() ? undefined : 'This value is locked, or in a set'}
            onClick={() => void add()}
          >
            {getTarget() === 'array' ? 'Add item' : 'Add property'}
          </button>
        </Show>
        <button type="button" class={buttonClass} disabled title="Not built yet">
          Edit as JSON
        </button>
      </div>
      <PropertyGrid path={props.path} />
    </div>
  );
}
