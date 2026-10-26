import type { JSX } from '@solidjs/web';
import { Show, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getNodeName } from '../../logic/get-node-name';
import { createPathMenu } from '../../PathMenu/create-path-menu';
import { createEditStatus } from '../createEditStatus';
import { DeleteButton } from './DeleteButton';
import { deleteValue } from './deleteValue';
import { PinButton } from './PinButton';

interface Props {
  path: Path;
  /** Under the path */
  children?: JSX.Element;
  /** A button to lock the value, for a value that has no lock of its own in its editor */
  hasLock?: boolean;
}

/** The top of the inspector, for any value: what it is called, where it is, and pin and delete */
export function ValueHeader(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const getTitle = () => getNodeName(getLatestState(), props.path);
  const isRoot = () => props.path.length === 0;

  const { canDelete, hasLockedInside, getStatus, canToggleLock, toggleLock } = createEditStatus(
    () => props.path,
  );

  const onContextMenu = createPathMenu(() => props.path);

  return (
    <header class="flex flex-col gap-1" onContextMenu={onContextMenu}>
      <div class="flex items-center gap-2">
        <TypeIcon type={getType()} />
        <h2 class="font-mono text-base font-semibold break-all">{getTitle()}</h2>
        <Show when={!isRoot()}>
          <div class="-mr-2 ml-auto flex gap-1">
            <PinButton isPinned={isPinned(props.path)} onToggle={() => togglePin(props.path)} />
            <Show when={props.hasLock}>
              <LockButton
                status={getStatus()}
                onToggle={() => void toggleLock()}
                disabled={!canToggleLock()}
                disabledTitle="This value is in a set, or holds a function: it cannot be locked"
              />
            </Show>
            <DeleteButton
              disabled={!canDelete()}
              disabledTitle={
                hasLockedInside() ? 'Something inside this value is locked' : undefined
              }
              onDelete={() => void deleteValue(props.path, getTitle())}
            />
          </div>
        </Show>
      </div>
      <PrettyPath class="font-mono text-xs break-all text-gray-400" path={props.path} statePrefix />
      {props.children}
    </header>
  );
}
