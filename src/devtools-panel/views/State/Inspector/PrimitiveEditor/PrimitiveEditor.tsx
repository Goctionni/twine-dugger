import { Match, Switch, createMemo } from 'solid-js';

import { deleteFromState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned, togglePin } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { createEditStatus } from '../createEditStatus';
import { BooleanEditor } from './BooleanEditor';
import { confirmDelete } from './confirmDelete';
import { DeleteButton } from './DeleteButton';
import { NumberEditor } from './NumberEditor';
import { PinButton } from './PinButton';
import { StringEditor } from './StringEditor';
import { ValueTabs } from './ValueTabs';

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

export function PrimitiveEditor(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const { getStatus, isDisabled } = createEditStatus(() => props.path);
  // Locked values would be put back, and the items of a set cannot be named
  const canDelete = () => getStatus() === 'unlocked' && !isDisabled();

  const deleteValue = async () => {
    const parent = getPathValue(getLatestState(), props.path.slice(0, -1));
    const isArrayItem = getJsonType(parent) === 'array';
    if (await confirmDelete(getTitle(), isArrayItem)) await deleteFromState(props.path);
  };

  const getTitle = () => getPathLabels(getLatestState(), props.path).at(-1) ?? 'State';

  return (
    <div class="flex flex-col gap-3 p-3">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <TypeIcon type={getType()} />
          <h2 class="font-mono text-base font-semibold break-all">{getTitle()}</h2>
          <div class="ml-auto flex gap-1">
            <PinButton isPinned={isPinned(props.path)} onToggle={() => togglePin(props.path)} />
            <DeleteButton disabled={!canDelete()} onDelete={() => void deleteValue()} />
          </div>
        </div>
        <PrettyPath
          class="font-mono text-xs break-all text-gray-400"
          path={props.path}
          statePrefix
        />
      </header>
      <Switch>
        <Match when={getType() === 'boolean'}>
          <BooleanEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'string'}>
          <StringEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'number'}>
          <NumberEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={!['boolean', 'string', 'number'].includes(getType())}>
          <RenderValue value={getValue()} />
        </Match>
      </Switch>
      <ValueTabs path={props.path} onSelect={props.onSelect} />
    </div>
  );
}
