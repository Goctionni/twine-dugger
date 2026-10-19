import type { JSX } from '@solidjs/web';
import { Show, createMemo } from 'solid-js';

import { deleteFromState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { createEditStatus } from '../createEditStatus';
import { confirmDelete } from './confirmDelete';
import { DeleteButton } from './DeleteButton';
import { PinButton } from './PinButton';

interface Props {
  path: Path;
  /** Under the path */
  children?: JSX.Element;
}

/** The top of the inspector, for any value: what it is called, where it is, and pin and delete */
export function ValueHeader(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const getTitle = () => getPathLabels(getLatestState(), props.path).at(-1) ?? 'State';
  const isRoot = () => props.path.length === 0;

  const { getStatus, isDisabled } = createEditStatus(() => props.path);
  // Locked values would be put back, and the items of a set cannot be named
  const canDelete = () => getStatus() === 'unlocked' && !isDisabled();

  const deleteValue = async () => {
    const parent = getPathValue(getLatestState(), props.path.slice(0, -1));
    const isArrayItem = getJsonType(parent) === 'array';
    const hasContents = isContainer(getValue());
    if (await confirmDelete(getTitle(), { isArrayItem, hasContents })) {
      await deleteFromState(props.path);
    }
  };

  return (
    <header class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <TypeIcon type={getType()} />
        <h2 class="font-mono text-base font-semibold break-all">{getTitle()}</h2>
        <Show when={!isRoot()}>
          <div class="ml-auto flex gap-1">
            <PinButton isPinned={isPinned(props.path)} onToggle={() => togglePin(props.path)} />
            <DeleteButton disabled={!canDelete()} onDelete={() => void deleteValue()} />
          </div>
        </Show>
      </div>
      <PrettyPath class="font-mono text-xs break-all text-gray-400" path={props.path} statePrefix />
      {props.children}
    </header>
  );
}
