import clsx from 'clsx';
import { createMemo, For } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/store';
import { getLockStatus } from '@/devtools-panel/utils/is-locked';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { LockStatus, ObjectValue, Path } from '@/shared/shared-types';

import { duplicateStateProperty, setState } from '../../utils/api';
import { showPromptDialog } from '../Common/PromptProvider';
import { createContextMenuHandler } from '../ContextMenu';
import { AddPropertyDialog } from './AddPropertyDialog';
import { DuplicateKeyDialog } from './DuplicateKeyDialog';
import { TypeIcon } from './TypeIcon';
import { PathChunk } from './types';

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
    () => getObjectPathValue(getActiveState()!, props.path) as ObjectValue,
  );

  const getKeys = createMemo(() => {
    // TODO: Sort by type
    const object = getObject();
    if (object instanceof Map) return Array.from(object.keys());
    if (object instanceof Array) return Array.from(Array(object.length).keys());
    return Object.keys(object);
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
          chunk={props.chunk}
          onConfirm={(name, value) => resolve({ name, value })}
        />
      ),
    );

    if (result && result.name) {
      const fullPath = [...props.path, result.name];
      await setState(fullPath, result.value);
    }
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
        <For each={getKeys()}>
          {(child) => {
            const childPath = () => [...props.path, child.text];
            const lockStatus = () => getLockStatus(childPath, props.getLockedPaths);
            return (
              <NavItem
                child={child}
                lockStatus={lockStatus()}
                setLockState={(lock) => {
                  if (lock) props.addLockPath(childPath());
                  else props.removeLockPath(childPath());
                }}
                active={child.text === props.selectedProperty}
                onClick={() => props.onClick(child.text)}
                onDelete={() => props.onDeleteProperty(childPath())}
                onDuplicate={() => onDuplicate(child.text)}
              />
            );
          }}
        </For>
      </ul>
    </div>
  );
}

interface NavItemProps {
  child: PathChunk['childKeys'][number];
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
