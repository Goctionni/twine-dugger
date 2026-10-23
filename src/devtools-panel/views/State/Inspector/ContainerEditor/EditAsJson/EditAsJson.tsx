import { For, Match, Show, Switch, createMemo, createSignal } from 'solid-js';

import { deleteFromState, setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths } from '@/devtools-panel/store/locks';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { sameItems } from '@/devtools-panel/utils/same-items';
import {
  SET_MARKER,
  getContainerKeys,
  getContainerSize,
  getJsonType,
  getPathValue,
  isContainer,
  type ContainerType,
} from '@/shared/json-safe';
import { pathStartsWith } from '@/shared/path-equals';
import type { JSONSafeObject, JSONSafeValue, Path } from '@/shared/shared-types';

import { compareJson, type Change } from './compare-json';

interface Props {
  path: Path;
  /** Selected in the grid. Some (not all) of the primitive properties: only those are edited */
  selectedKeys: readonly (string | number)[];
  onClose: () => void;
}

const checkboxLabelClass = 'flex w-fit items-center gap-1.5 text-xs text-gray-400 select-none';

const shorten = (value?: JSONSafeValue) => {
  const text = JSON.stringify(value) ?? 'undefined';
  return text.length > 40 ? `${text.slice(0, 39)}…` : text;
};

function ChangeLine(props: { change: Change }) {
  return (
    <div>
      <Switch>
        <Match when={props.change.op === 'add'}>
          <span class="text-green-400">add</span> {props.change.key} = {shorten(props.change.after)}
        </Match>
        <Match when={props.change.op === 'delete'}>
          <span class="text-red-400">delete</span> {props.change.key}
        </Match>
        <Match when={props.change.op === 'set'}>
          {props.change.key} {shorten(props.change.before)} → {shorten(props.change.after)}
          <Show when={getJsonType(props.change.before) !== getJsonType(props.change.after)}>
            <span class="text-amber-400">
              {' '}
              ({getJsonType(props.change.before)} → {getJsonType(props.change.after)})
            </span>
          </Show>
        </Match>
      </Switch>
    </div>
  );
}

/** Tab indents the line at the caret, or the lines that are selected. Shift+Tab takes it back */
function indent(area: HTMLTextAreaElement, isBack: boolean) {
  const { value, selectionStart: start, selectionEnd: end } = area;
  const hasSeveralLines = value.slice(start, end).includes('\n');
  if (!isBack && !hasSeveralLines) {
    area.setRangeText('  ', start, end, 'end');
    return;
  }

  const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
  // A selection that ends right after a line break leaves the next line out
  const lastSelected = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const lastLineEnd = value.indexOf('\n', lastSelected);
  const lines = value.slice(firstLineStart, lastLineEnd === -1 ? value.length : lastLineEnd);
  const changedLines = lines
    .split('\n')
    .map((line) => (isBack ? line.replace(/^( {1,2}|\t)/, '') : `  ${line}`))
    .join('\n');

  // 'preserve' keeps the edit in the undo history
  area.setRangeText(changedLines, firstLineStart, firstLineStart + lines.length, 'preserve');
  if (hasSeveralLines) {
    area.setSelectionRange(firstLineStart, firstLineStart + changedLines.length);
  } else {
    // The caret stays where it was in the text, so it moves with the removed spaces
    const removed = lines.length - changedLines.length;
    const caret = Math.max(firstLineStart, start - removed);
    area.setSelectionRange(caret, caret);
  }
}

/**
 * The properties of a container, or the items of an array or a set, as JSON text. What is saved is
 * the difference between the text and what the container holds now.
 */
export function EditAsJson(props: Props) {
  const getContainer = () => getPathValue(getLatestState(), props.path);
  const getContainerType = () => getJsonType(getContainer()) as ContainerType;
  const isList = () => getContainerType() === 'array' || getContainerType() === 'set';

  const [includeContainers, setIncludeContainers] = createSignal(false);
  const [getEditedText, setEditedText] = createSignal<string>();
  const [showChanges, setShowChanges] = createSignal(false);
  const [isSaving, setSaving] = createSignal(false);

  // Which properties are in the text: the selected ones (when that is some of the primitive ones),
  // else the primitive ones, and the container ones too if asked for. Lists have all their items.
  const getAllKeys = createMemo(
    () => (isList() ? [] : getContainerKeys(getContainer(), getContainerType()).map(String)),
    { equals: sameItems },
  );
  const getPrimitiveKeys = createMemo(
    () => getAllKeys().filter((key) => !isContainer((getContainer() as JSONSafeObject)[key])),
    { equals: sameItems },
  );
  const getSelectedKeys = () =>
    getPrimitiveKeys().filter((key) => props.selectedKeys.map(String).includes(key));
  // All of them selected is the same as none
  const isEditingSelection = () =>
    getSelectedKeys().length > 0 && getSelectedKeys().length < getPrimitiveKeys().length;
  const getKeysInEdit = () => {
    if (isEditingSelection()) return getSelectedKeys();
    return includeContainers() ? getAllKeys() : getPrimitiveKeys();
  };
  const getContainerPropertyCount = () => getAllKeys().length - getPrimitiveKeys().length;

  // Until something is typed, the text follows the container
  const getGeneratedText = createMemo(() => {
    const container = getContainer();
    if (getContainerType() === 'array') return JSON.stringify(container, null, 2);
    if (getContainerType() === 'set') {
      return JSON.stringify((container as JSONSafeValue[]).slice(1), null, 2);
    }
    const properties = container as JSONSafeObject;
    const edited = Object.fromEntries(getKeysInEdit().map((key) => [key, properties[key]]));
    return JSON.stringify(edited, null, 2);
  });
  const getText = () => getEditedText() ?? getGeneratedText();
  const isEdited = () => getText() !== getGeneratedText();

  const getComparison = createMemo(() =>
    compareJson(getContainerType(), getContainer(), getKeysInEdit(), getText()),
  );

  // A key is locked when its value, or a value above or beneath it, is
  const getLockedKeys = () =>
    getComparison()
      .changes.map((change) => change.key)
      .filter((key) => {
        const path = [...props.path, key];
        return getLockedPaths().some(
          (locked) => pathStartsWith(path, locked) || pathStartsWith(locked, path),
        );
      });
  const getProblem = () => {
    if (getComparison().error) return getComparison().error;
    const lockedKeys = getLockedKeys();
    if (lockedKeys.length === 0) return undefined;
    return `${lockedKeys.join(', ')} ${lockedKeys.length === 1 ? 'is' : 'are'} locked, and cannot be changed`;
  };

  const getScopeText = () => {
    if (getContainerType() === 'set') {
      return `all ${getContainerSize(getContainer() as JSONSafeValue[])} items (the set is shown as an array)`;
    }
    if (isList()) return `all ${getContainerSize(getContainer() as JSONSafeValue[])} items`;
    return isEditingSelection()
      ? `${getSelectedKeys().length} selected properties`
      : 'all properties';
  };

  const save = async () => {
    if (getProblem() || isSaving()) return;
    setSaving(true);
    try {
      const { changes } = getComparison();
      if (getContainerType() === 'set') {
        // The items of a set have no place to write to: the whole set is written
        if (changes.length > 0) {
          await setState(props.path, [SET_MARKER, ...(JSON.parse(getText()) as JSONSafeValue[])]);
        }
      } else {
        // Writes first, then the deletes: the changes of an array list its deletes from the last
        for (const change of changes) {
          if (change.op !== 'delete') await setState([...props.path, change.key], change.after);
        }
        for (const change of changes) {
          if (change.op === 'delete') await deleteFromState([...props.path, change.key]);
        }
      }
      props.onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Edit as JSON" class="flex flex-col gap-1.5">
      <p class="text-[11px] text-gray-400">Editing {getScopeText()}</p>

      <Show when={!isList() && !isEditingSelection() && getContainerPropertyCount() > 0}>
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
          <Show when={!includeContainers()}>
            <span class="text-amber-400">
              {getContainerPropertyCount()} container{' '}
              {getContainerPropertyCount() === 1 ? 'property' : 'properties'} excluded
            </span>
          </Show>
        </label>
      </Show>

      <textarea
        aria-label="JSON"
        spellcheck="false"
        wrap="off"
        value={getText()}
        onInput={(event) => setEditedText(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
          event.preventDefault();
          indent(event.currentTarget, event.shiftKey);
          setEditedText(event.currentTarget.value);
        }}
        class={[
          baseInputClasses,
          'min-h-55 w-full resize-y overflow-auto rounded-md font-mono text-xs leading-normal whitespace-pre',
        ]}
      />

      <Show when={getProblem()}>
        <p role="alert" class="font-mono text-xs text-red-400">
          {getProblem()}
        </p>
      </Show>
      <For each={getComparison().warnings}>
        {(warning) => <p class="text-xs text-amber-400">⚠ {warning}</p>}
      </For>

      <div class="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          class={btnClass('contained')}
          disabled={Boolean(getProblem()) || isSaving()}
          onClick={() => void save()}
        >
          Save changes
        </button>
        <button
          type="button"
          class={btnClass('outline', 'clr-gray')}
          onClick={() => props.onClose()}
        >
          Cancel
        </button>
      </div>

      <label class={[checkboxLabelClass, 'mt-1']}>
        <input
          type="checkbox"
          class="h-4 w-4 check-box"
          checked={showChanges()}
          onChange={(event) => setShowChanges(event.currentTarget.checked)}
        />
        Show list of changes
      </label>
      <Show when={showChanges()}>
        <div class="font-mono text-[11px] text-gray-400">
          <Show
            when={getComparison().changes.length > 0 || getComparison().error}
            fallback="No changes."
          >
            <For each={getComparison().changes}>{(change) => <ChangeLine change={change} />}</For>
          </Show>
        </div>
      </Show>
    </section>
  );
}
