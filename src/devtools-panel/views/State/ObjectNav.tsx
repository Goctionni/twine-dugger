import clsx from 'clsx';
import { createMemo, For, Show } from 'solid-js';

import {
  addFilteredPath,
  addLockPath,
  createGetSetting,
  createGetViewState,
  getActiveState,
  getLockedPaths,
  isPathFiltered,
  removeLockPath,
  setViewState,
} from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';
import { getLockStatus } from '@/devtools-panel/views/State/lock-helper';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { ContainerValue, LockStatus, Path, Value, ValueType } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import {
  deleteFromState,
  duplicateStateProperty,
  setState,
  setStatePropertyLock,
} from '../../api/api';
import { TypeIcon } from '../../ui/display/TypeIcon';
import { createContextMenuHandler } from '../../ui/util/ContextMenu';
import { AddPropertyDialog } from './dialogs/AddPropertyDialog';
import { DuplicateKeyDialog } from './dialogs/DuplicateKeyDialog';
import { createSorter } from './property-sorter';

const getNameForProperty = () =>
  showPromptDialog<string>('Name for property', (resolve) => (
    <DuplicateKeyDialog onConfirm={resolve} />
  ));

interface Props {
  path: Path;
  selectedProperty?: string | number;
}

export function ObjectNav(props: Props) {
  const getName = () => props.path[props.path.length - 1];
  const getObject = createMemo(
    () => getObjectPathValue(getActiveState()!, props.path) as ContainerValue,
  );
  const getPropertyOrder = createGetSetting('state.propertyOrder');

  const getChildren = createMemo(() => {
    const object = getObject();
    if (!object) return [];

    const propertyOrder = getPropertyOrder();
    const sorter = createSorter(object, propertyOrder);

    const rawKeys =
      object instanceof Map
        ? sorter(Array.from(object.keys()))
        : object instanceof Array
          ? Array.from(Array(object.length).keys())
          : sorter(Object.keys(object));

    // Convert to child key format
    return rawKeys.map((key): ContainerChild => {
      let value: Value = {};
      if (object instanceof Map) value = object.get(key);
      else if (Array.isArray(object)) value = object[Number(key)];
      else value = object[key];

      return { text: key, type: getSpecificType(value) };
    });
  });

  const onDuplicate = async (property: string | number) => {
    const object = getObject();
    // For arrays, the duplicated value is added to the end of the array
    if (Array.isArray(object)) return duplicateStateProperty(props.path, property);

    // For Objects/Maps, we need a name for the duplicated property
    const newPropertyKey = await getNameForProperty();
    if (newPropertyKey) return duplicateStateProperty(props.path, property, newPropertyKey);
  };

  const onAdd = async () => {
    const result = await showPromptDialog<{ name: string; value: unknown }>(
      'Add new',
      (resolve) => (
        <AddPropertyDialog
          path={props.path}
          onConfirm={(name, value) => resolve({ name, value })}
        />
      ),
    );

    if (result && result.name) {
      const fullPath = [...props.path, result.name];
      await setState(fullPath, result.value);
    }
  };

  const handlePropertyClick = (property: string | number) => {
    const currentPath = createGetViewState('state', 'path')();
    const newPath = [...props.path, property];
    const isEqual =
      currentPath.length === newPath.length &&
      currentPath.every((val, idx) => val === newPath[idx]);
    setViewState('state', 'path', [...(isEqual ? props.path : newPath)]);
  };

  const handleDelete = async (path: Path) => {
    await deleteFromState(path);
  };

  return (
    <div class="flex h-full w-max max-w-3xs flex-col border-r border-r-gray-700 px-2">
      <p class="w-full overflow-hidden text-lg text-ellipsis">{getName()}</p>
      <ul>
        <li>
          <a
            onClick={onAdd}
            class="flex cursor-pointer items-center gap-1 rounded-md p-1 text-green-400 hover:bg-gray-700"
          >
            ➕ <span class="flex-1 overflow-hidden text-ellipsis">Add new...</span>
          </a>
        </li>
      </ul>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={getChildren()}>
          {(child) => {
            const childPath = () => [...props.path, child.text];
            const lockStatus = () => getLockStatus(childPath, getLockedPaths);
            return (
              <NavItem
                child={child}
                lockStatus={lockStatus()}
                setLockState={(lock) => {
                  setStatePropertyLock(childPath(), lock);
                  if (lock) addLockPath(childPath());
                  else removeLockPath(childPath());
                }}
                active={child.text === props.selectedProperty}
                onClick={() => handlePropertyClick(child.text)}
                onDelete={() => handleDelete(childPath())}
                onDuplicate={() => onDuplicate(child.text)}
                path={childPath()}
              />
            );
          }}
        </For>
      </ul>
    </div>
  );
}

interface ContainerChild {
  text: string | number;
  type: ValueType;
}

interface NavItemProps {
  path: Path;
  child: ContainerChild;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  lockStatus: LockStatus;
  setLockState: (lock: boolean) => void;
}

function NavItem(props: NavItemProps) {
  const onContextMenu = createContextMenuHandler([
    {
      disabled: () => props.lockStatus === 'ancestor-lock',
      label: () => (
        <>
          <Show when={props.lockStatus !== 'locked'}>
            Lock "<PrettyPath path={props.path} class="font-mono" />"
          </Show>
          <Show when={props.lockStatus === 'locked'}>
            Unlock "<PrettyPath path={props.path} class="font-mono" />"
          </Show>
        </>
      ),
      onClick: () => props.setLockState(props.lockStatus === 'unlocked'),
    },
    {
      label: () => (
        <>
          Filter "<PrettyPath path={props.path} class="font-mono" />" from DiffLog
        </>
      ),
      onClick: () => addFilteredPath(props.path),
      disabled: () => isPathFiltered(props.path),
    },
    {
      label: () => (
        <>
          Duplicate "<PrettyPath path={props.path} class="font-mono" />"
        </>
      ),
      onClick: () => props.onDuplicate(),
      disabled: () => props.lockStatus === 'ancestor-lock',
    },
    {
      label: () => (
        <>
          Delete "<PrettyPath path={props.path} class="font-mono" />"
        </>
      ),
      onClick: () => props.onDelete(),
      disabled: () => props.lockStatus !== 'unlocked',
    },
  ]);

  return (
    <li onContextMenu={onContextMenu}>
      <a
        onClick={() => props.onClick()}
        class={clsx(
          'flex cursor-pointer items-center gap-1 rounded-md p-1',
          props.active
            ? 'outline-2 -outline-offset-2 outline-gray-300'
            : 'outline-transparent hover:bg-gray-700',
        )}
      >
        <TypeIcon type={props.child.type} />
        <span class="flex-1 overflow-hidden text-ellipsis">
          {props.child.text}
          {props.lockStatus === 'locked' && '🔒'}
          {props.lockStatus === 'ancestor-lock' && <span class="saturate-0">🔒</span>}
        </span>
      </a>
    </li>
  );
}
