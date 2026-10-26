import { Show } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';

import { getNodeName } from '../../logic/get-node-name';
import { isRecentlyChanged } from '../../Navigators/Shared/recently-changed';
import { createEditStatus } from '../createEditStatus';
import { ValueEditor } from '../PrimitiveEditor/ValueEditor';
import { DeleteButton } from '../ValueHeader/DeleteButton';
import { deleteValue } from '../ValueHeader/deleteValue';
import { rowColumnsClass } from './row-layout';

interface Props {
  /** The path of the property itself */
  path: Path;
  isSelected: boolean;
  onToggle: () => void;
  /** Where the row is among the rows (from 1) and how many there are: the others may not be in the DOM */
  position: number;
  size: number;
}

/** A primitive property of the container: its name, an editor for its value, and delete */
export function PropertyRow(props: Props) {
  const getName = () => getNodeName(getLatestState(), props.path);
  const { canChange } = createEditStatus(() => props.path);
  return (
    <li
      aria-posinset={props.position}
      aria-setsize={props.size}
      class={[rowColumnsClass, 'items-start py-1']}
    >
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
            class="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300"
          />
        </Show>
      </label>
      <div class="min-w-0">
        <ValueEditor path={props.path} label={getName()} compact />
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
