import { createSignal, For } from 'solid-js';
import { PathChunk } from './types';
import { TypeIcon } from './TypeIcon';
import clsx from 'clsx';
import { useContextMenu } from '../ContextMenu/useContextMenu';
import { Path } from '@/shared/shared-types';
import { duplicateStateProperty } from '../../utils/api';
import { showPromptDialog } from '../Common/PromptProvider';
import { DuplicateKeyDialog } from './DuplicateKeyDialog';

interface Props {
  chunk: PathChunk;
  selectedProperty?: string | number;
  onClick: (childKey: string | number) => void;
  onDeleteProperty: (path: Path) => void;
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
    const newPropertyKey = await showPromptDialog<string>((resolve) => (
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
          {(child) => (
            <NavItem
              child={child}
              active={child.text === props.selectedProperty}
              onClick={() => props.onClick(child.text)}
              onDelete={() => props.onDeleteProperty([...props.chunk.path, child.text])}
              onDuplicate={() => onDuplicate(child.text)}
            />
          )}
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
}

function NavItem(props: NavItemProps) {
  const elRef = useContextMenu([
    {
      label: `Duplicate "${props.child.text}"`,
      onClick: () => props.onDuplicate(),
    },
    {
      label: `Delete "${props.child.text}"`,
      onClick: () => props.onDelete(),
    },
  ]);

  return (
    <li ref={elRef}>
      <a
        onClick={props.onClick}
        class={clsx(
          'flex items-center gap-1 p-1 cursor-pointer rounded-md',
          props.active
            ? 'outline-gray-300 outline-2 -outline-offset-2'
            : 'outline-transparent hover:bg-gray-700',
        )}
      >
        <TypeIcon type={props.child.type} />
        <span class="flex-1 overflow-hidden overflow-ellipsis">{props.child.text}</span>
      </a>
    </li>
  );
}
