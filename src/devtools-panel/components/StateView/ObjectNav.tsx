import clsx from 'clsx';
import { createMemo, For } from 'solid-js';

import {
  addLockPath,
  createGetViewState,
  getActiveState,
  removeLockPath,
  setViewState,
} from '@/devtools-panel/store/store';
import { getLockStatus } from '@/devtools-panel/utils/is-locked';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { LockStatus, ObjectValue, Path, ValueType } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { deleteFromState, duplicateStateProperty, setState } from '../../utils/api';
import { showPromptDialog } from '../Common/PromptProvider';
import { createContextMenuHandler } from '../ContextMenu';
import { AddPropertyDialog } from './AddPropertyDialog';
import { DuplicateKeyDialog } from './DuplicateKeyDialog';
import { TypeIcon } from './TypeIcon';

const getNameForProperty = () =>
  showPromptDialog<string>('Name for property', (resolve) => (
    <DuplicateKeyDialog onConfirm={resolve} />
  ));

interface Props {
  path: Path;
  selectedProperty?: string | number;
}

export function ObjectNav(props: Props) {
  const getLockedPaths = createGetViewState('state', 'lockedPaths');

  const getName = () => props.path[props.path.length - 1];
  const getObject = createMemo(
    () => getObjectPathValue(getActiveState()!, props.path) as ObjectValue,
  );

  const getChildren = createMemo(() => {
    // TODO: Sort by type
    const object = getObject();
    const rawKeys =
      object instanceof Map
        ? Array.from(object.keys())
        : object instanceof Array
          ? Array.from(Array(object.length).keys())
          : Object.keys(object);

    // Convert to child key format
    return rawKeys.map(
      (key): ContainerChild => ({
        text: key,
        type: getSpecificType(object instanceof Map ? object.get(key) : object[key]),
      }),
    );
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
    setViewState('state', 'path', isEqual ? props.path : newPath);
  };

  const handleDelete = async (path: Path) => {
    await deleteFromState(path);
  };

  return (
    <div class="w-max max-w-3xs flex flex-col h-full px-2 border-r border-r-gray-700">
      <p class="text-lg">{getName()}</p>
      <ul>
        <li>
          <a
            onClick={onAdd}
            class="flex items-center gap-1 p-1 cursor-pointer rounded-md text-green-400 hover:bg-gray-700"
          >
            ➕ <span class="flex-1 overflow-hidden overflow-ellipsis">Add new...</span>
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
                  if (lock) addLockPath(childPath());
                  else removeLockPath(childPath());
                }}
                active={child.text === props.selectedProperty}
                onClick={() => handlePropertyClick(child.text)}
                onDelete={() => handleDelete(childPath())}
                onDuplicate={() => onDuplicate(child.text)}
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
      label: () => {
        return props.lockStatus !== 'locked'
          ? `Lock "${props.child.text}"`
          : `Unlock "${props.child.text}"`;
      },
      onClick: () => props.setLockState(props.lockStatus === 'unlocked'),
    },
    {
      label: () => `Duplicate "${props.child.text}"`,
      onClick: () => props.onDuplicate(),
      disabled: () => props.lockStatus === 'ancestor-lock',
    },
    {
      label: () => `Delete "${props.child.text}"`,
      onClick: () => props.onDelete(),
      disabled: () => props.lockStatus !== 'unlocked',
    },
  ]);

  return (
    <li onContextMenu={onContextMenu}>
      <a
        onClick={() => props.onClick()}
        class={clsx(
          'flex items-center gap-1 p-1 cursor-pointer rounded-md',
          props.active
            ? 'outline-gray-300 outline-2 -outline-offset-2'
            : 'outline-transparent hover:bg-gray-700',
        )}
      >
        <TypeIcon type={props.child.type} />
        <span class="flex-1 overflow-hidden overflow-ellipsis">
          {props.child.text}
          {props.lockStatus === 'locked' && '🔒'}
          {props.lockStatus === 'ancestor-lock' && <span class="saturate-0">🔒</span>}
        </span>
      </a>
    </li>
  );
}
