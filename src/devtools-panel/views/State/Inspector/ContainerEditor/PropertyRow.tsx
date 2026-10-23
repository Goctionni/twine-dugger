import { Match, Show, Switch, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { isRecentlyChanged } from '../../Navigators/Shared/recently-changed';
import { createEditStatus } from '../createEditStatus';
import { BooleanEditor } from '../PrimitiveEditor/BooleanEditor';
import { NumberEditor } from '../PrimitiveEditor/NumberEditor';
import { StringEditor } from '../PrimitiveEditor/StringEditor';
import { DeleteButton } from '../ValueHeader/DeleteButton';
import { deleteValue } from '../ValueHeader/deleteValue';

interface Props {
  /** The path of the property itself */
  path: Path;
  isSelected: boolean;
  onToggle: () => void;
}

/** A primitive property of the container: its name, an editor for its value, and delete */
export function PropertyRow(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const getName = () => getPathLabels(getLatestState(), props.path).at(-1) ?? '';
  const { canChange } = createEditStatus(() => props.path);

  return (
    <li class="col-span-3 grid grid-cols-subgrid items-start py-1">
      {/* Only the checkbox and the name react to the pointer, and show that the row is selected */}
      <label
        class={[
          'mr-1 flex h-7.5 min-w-0 cursor-pointer items-center gap-2 rounded-md border ps-2 pe-1 select-none',
          props.isSelected ? 'border-sky-500 bg-sky-950' : 'border-transparent hover:bg-gray-800',
        ]}
      >
        <input
          type="checkbox"
          class="h-4 w-4 check-box shrink-0"
          checked={props.isSelected}
          onChange={() => props.onToggle()}
        />
        <span class="truncate font-mono text-sm" title={getName()}>
          {getName()}
        </span>
        {/* Part of the label, so it takes the room of the name only when there is none to spare */}
        <Show when={isRecentlyChanged(props.path)}>
          <span
            role="img"
            aria-label="Changed recently"
            title="Changed recently"
            class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
          />
        </Show>
      </label>
      <div class="min-w-0">
        <Switch>
          <Match when={getType() === 'boolean'}>
            <BooleanEditor path={props.path} label={getName()} />
          </Match>
          <Match when={getType() === 'number'}>
            <NumberEditor path={props.path} label={getName()} compact />
          </Match>
          <Match when={getType() === 'string'}>
            <StringEditor path={props.path} label={getName()} compact />
          </Match>
          <Match when={!['boolean', 'number', 'string'].includes(getType())}>
            <div class="flex min-h-7.5 min-w-0 items-center text-sm">
              <RenderValue value={getValue()} />
            </div>
          </Match>
        </Switch>
      </div>
      <div class="pl-1">
        <DeleteButton
          disabled={!canChange()}
          onDelete={() => void deleteValue(props.path, getName())}
        />
      </div>
    </li>
  );
}
