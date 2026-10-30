import { createSignal, Show, snapshot, untrack } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';
import {
  getContainerKeys,
  getContainerSize,
  getJsonType,
  getPathValue,
  isContainer,
} from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { checkName } from '../Inspector/ContainerEditor/add-property';

/**
 * Writes a copy of the value next to it: at the end of an array, under a name asked for in an
 * object or a map. The panel writes it itself, so every story format can do it
 */
export async function duplicateValue(path: Path) {
  const parentPath = path.slice(0, -1);
  const [parent, value] = untrack(() => [
    getPathValue(getLatestState(), parentPath),
    snapshot(getPathValue(getLatestState(), path)),
  ]);
  if (value === undefined || !isContainer(parent)) return;

  const type = getJsonType(parent);
  if (type === 'array') {
    await setState([...parentPath, getContainerSize(parent)], value, { deep: isContainer(value) });
    return;
  }
  if (type !== 'object' && type !== 'map') return;

  const name = await askName(String(path.at(-1)), getContainerKeys(parent, type));
  if (name !== undefined)
    await setState([...parentPath, name], value, { deep: isContainer(value) });
}

async function askName(sourceKey: string, existingKeys: readonly (string | number)[]) {
  try {
    return await showPromptDialog<string | undefined>('Duplicate value', (done) => (
      <NameForm sourceKey={sourceKey} existingKeys={existingKeys} onDone={done} />
    ));
  } catch {
    return undefined;
  }
}

function NameForm(props: {
  sourceKey: string;
  existingKeys: readonly (string | number)[];
  onDone: (name: string | undefined) => void;
}) {
  // oxlint-disable-next-line solid/reactivity
  const [getName, setName] = createSignal(`${props.sourceKey}_copy`);
  const [isTouched, setTouched] = createSignal(false);
  const getProblem = () => checkName(getName(), props.existingKeys);

  return (
    <form
      class="flex w-full flex-col gap-3 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!getProblem()) props.onDone(getName());
      }}
    >
      <label class="flex flex-col gap-1 text-sm text-gray-300">
        Name of the copy
        <input
          ref={(input: HTMLInputElement) => queueMicrotask(() => input.select())}
          autofocus
          spellcheck="false"
          autocomplete="off"
          value={getName()}
          onInput={(event) => {
            setName(event.currentTarget.value);
            setTouched(true);
          }}
          class={[baseInputClasses, 'rounded-md']}
        />
      </label>
      <Show when={isTouched() && getProblem()}>
        <p class="-mt-2 text-xs text-red-400">{getProblem()}</p>
      </Show>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class={btnClass('outline', 'clr-gray')}
          onClick={() => props.onDone(undefined)}
        >
          Cancel
        </button>
        <button type="submit" class={btnClass('contained')} disabled={Boolean(getProblem())}>
          Duplicate
        </button>
      </div>
    </form>
  );
}
