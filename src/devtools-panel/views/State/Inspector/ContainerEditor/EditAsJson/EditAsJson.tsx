import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import type { Path } from '@/shared/shared-types';

import { ChangeLine } from './ChangeLine';
import { createEditedKeys } from './create-edited-keys';
import { createJsonDraft } from './create-json-draft';
import { handleJsonTextKey } from './textarea-editing';

interface Props {
  path: Path;
  /** Selected in the grid. Some (not all) of the primitive properties: only those are edited */
  selectedKeys: readonly (string | number)[];
  onClose: () => void;
}

const checkboxLabelClass = 'flex w-fit items-center gap-1.5 text-xs text-gray-400 select-none';

/**
 * The properties of a container, or the items of an array or a set, as JSON text. What is saved is
 * the difference between the text and what the container holds now.
 */
export function EditAsJson(props: Props) {
  const {
    getContainer,
    getContainerType,
    includeContainers,
    setIncludeContainers,
    getKeysInEdit,
    isLocked,
    getLockedCount,
    getContainerPropertyCount,
    hasContainerChoice,
    getScopeText,
  } = createEditedKeys(props);
  const {
    getText,
    setEditedText,
    isEdited,
    getComparison,
    getProblem,
    getListedChanges,
    isSaving,
    save,
  } = createJsonDraft({
    getPath: () => props.path,
    getContainer,
    getContainerType,
    getKeysInEdit,
    isLocked,
    onSaved: () => props.onClose(),
  });
  const [showChanges, setShowChanges] = createSignal(false);

  const onTextKeyDown = (event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) => {
    if (handleJsonTextKey(event)) setEditedText(event.currentTarget.value);
  };

  return (
    <section aria-label="Edit as JSON" class="flex flex-col gap-1.5">
      {/* At the top, so that it is in reach however long the text is */}
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] text-gray-400">Editing {getScopeText()}</p>
        <button
          type="button"
          class={btnClass('outline', 'clr-gray')}
          onClick={() => props.onClose()}
        >
          Cancel
        </button>
      </div>

      <Show when={getLockedCount() > 0}>
        <p class="text-xs text-amber-400">
          {getLockedCount()} locked {getLockedCount() === 1 ? 'property' : 'properties'} excluded
        </p>
      </Show>
      <Show when={hasContainerChoice() && !includeContainers()}>
        <p class="text-xs text-amber-400">
          {getContainerPropertyCount()} container{' '}
          {getContainerPropertyCount() === 1 ? 'property' : 'properties'} excluded
        </p>
      </Show>
      <Show when={hasContainerChoice()}>
        <label class={checkboxLabelClass}>
          <input
            type="checkbox"
            class="h-4 w-4 check-box"
            checked={includeContainers()}
            disabled={isEdited()}
            title={isEdited() ? 'Save or cancel your edits first' : undefined}
            onChange={(event) => setIncludeContainers(event.currentTarget.checked)}
          />
          Include container properties
        </label>
      </Show>

      <textarea
        aria-label="JSON"
        spellcheck="false"
        wrap="off"
        value={getText()}
        onInput={(event) => setEditedText(event.currentTarget.value)}
        onKeyDown={onTextKeyDown}
        aria-invalid={getProblem() ? 'true' : 'false'}
        class={[
          baseInputClasses,
          'min-h-55 w-full resize-y overflow-auto rounded-md font-mono text-xs leading-normal whitespace-pre',
          { 'border-red-500! focus:border-red-500! focus:ring-red-500!': Boolean(getProblem()) },
        ]}
      />

      <Switch>
        <Match when={getProblem()}>
          <p role="alert" class="text-xs text-red-400">
            {getProblem()}
          </p>
        </Match>
        <Match when={getComparison().warnings.length > 0}>
          <For each={getComparison().warnings}>
            {(warning) => <p class="text-xs text-amber-400">⚠ {warning}</p>}
          </For>
        </Match>
      </Switch>

      <div class="flex items-center justify-between gap-1.5 pt-1">
        <label class={checkboxLabelClass}>
          <input
            type="checkbox"
            class="h-4 w-4 check-box"
            checked={showChanges()}
            onChange={(event) => setShowChanges(event.currentTarget.checked)}
          />
          Show list of changes
        </label>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class={btnClass('outline', 'clr-gray')}
            onClick={() => props.onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            class={btnClass('contained')}
            disabled={Boolean(getProblem()) || isSaving()}
            onClick={() => void save()}
          >
            Save changes
          </button>
        </div>
      </div>
      <Show when={showChanges()}>
        <div class="font-mono text-[11px] text-gray-400">
          <Show
            when={getComparison().changes.length > 0 || getComparison().error}
            fallback="No changes."
          >
            <For each={getListedChanges()}>
              {(change) => <ChangeLine change={change} isLocked={isLocked(change.key)} />}
            </For>
          </Show>
        </div>
      </Show>
    </section>
  );
}
