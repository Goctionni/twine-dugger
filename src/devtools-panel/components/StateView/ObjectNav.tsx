import clsx from 'clsx';
import { createEffect, For } from 'solid-js';

import { getLockStatus } from '@/devtools-panel/utils/is-locked';
import { LockStatus, Path } from '@/shared/shared-types';

import { duplicateStateProperty } from '../../utils/api';
import { showPromptDialog } from '../Common/PromptProvider';
import { createContextMenuHandler } from '../ContextMenu';
import { DuplicateKeyDialog } from './DuplicateKeyDialog';
import { TypeIcon } from './TypeIcon';
import { PathChunk } from './types';

interface Props {
  chunk: PathChunk;
  selectedProperty?: string | number;
  onClick: (childKey: string | number) => void;
  onDeleteProperty: (path: Path) => void;
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
}

export function ObjectNav(props: Props) {
  const onDuplicate = async (property: string | number) => {
    const object = props.chunk.getValue();
    if (Array.isArray(object)) {
      // For arrays, the duplicated value is added to the end of the array
      duplicateStateProperty(props.chunk.path, property);
      return;
    }

    // For Objects/Maps, we need a name for the duplicated property
    const newPropertyKey = await showPromptDialog<string>('Name for property', (resolve) => (
      <DuplicateKeyDialog onConfirm={resolve} />
    ));

    if (newPropertyKey && typeof newPropertyKey === 'string') {
      duplicateStateProperty(props.chunk.path, property, newPropertyKey);
    }
  };
  return (
    <div class="w-max max-w-3xs flex flex-col h-full px-2 border-r border-r-gray-700">
      <p class="text-lg">{props.chunk.name}</p>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={props.chunk.childKeys}>
          {(child) => {
            const childPath = () => [...props.chunk.path, child.text];
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
