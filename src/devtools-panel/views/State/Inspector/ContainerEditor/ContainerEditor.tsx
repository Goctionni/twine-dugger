import { Match, Show, Switch, createMemo } from 'solid-js';

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
import { createSelection } from './createSelection';
import { createEditAsJson } from './EditAsJson/create-edit-as-json';
import { EditAsJson } from './EditAsJson/EditAsJson';
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
  const selection = createSelection(() => props.path);

  // The items of a set have no place to be named, so nothing is added to one from here
  const getTarget = (): AddTarget | undefined => {
    const type = getType();
    return type === 'object' || type === 'map' || type === 'array' ? type : undefined;
  };
  const { canChange } = createEditStatus(() => props.path);

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
    // Added as JSON, a container can hold Maps, Sets and Dates of its own: they are restored too
    await setState(path, value, { deep: isContainer(value) });
  };

  const { getCantEditReason, isEditingJson, setIsEditingJson } = createEditAsJson({
    containerPath: () => props.path,
    container: getContainer,
    selectedKeys: selection.getSelected,
  });

  return (
    <div class="flex flex-col gap-3 p-3">
      <ValueHeader path={props.path} hasLock>
        <p class="text-xs text-gray-400">
          {getCount()} {getCount() === 1 ? 'entry' : 'entries'}
        </p>
      </ValueHeader>
      <Show when={!isEditingJson()}>
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
          <button
            type="button"
            class={buttonClass}
            disabled={Boolean(getCantEditReason())}
            title={getCantEditReason()}
            onClick={() => setIsEditingJson(true)}
          >
            Edit as JSON
          </button>
        </div>
      </Show>
      <Switch>
        <Match when={isEditingJson()}>
          <EditAsJson
            path={props.path}
            selectedKeys={[...selection.getSelected()]}
            onClose={() => setIsEditingJson(false)}
          />
        </Match>
        <Match when={!isEditingJson()}>
          <PropertyGrid path={props.path} selection={selection} />
        </Match>
      </Switch>
    </div>
  );
}
