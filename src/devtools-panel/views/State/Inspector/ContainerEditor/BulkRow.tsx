import { Match, Show, Switch, createEffect, createMemo, createSignal } from 'solid-js';

import { setStateMulti } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLocks } from '@/devtools-panel/store/locks';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { JSONSafeValue, Path, ValueType, Write } from '@/shared/shared-types';

import { getLockStatus, isInsideSet } from '../logic/edit-status';
import { confirmDeleteMany } from '../ValueHeader/confirmDelete';
import { DeleteButton } from '../ValueHeader/DeleteButton';
import {
  getBulkKind,
  getBulkLockState,
  getKeysOfType,
  sortForDeletion,
  type BulkKind,
} from './bulk';
import { rowColumnsClass } from './row-layout';

type Key = string | number;

interface Props {
  /** The container */
  path: Path;
  /** All the properties of the grid, in its order */
  keys: readonly Key[];
  selectedKeys: readonly Key[];
  onSelect: (keys: Key[]) => void;
}

/**
 * The first row of the grid: it selects, and edits, locks or deletes what is selected. The value
 * starts as that of the first selected row, and is written to all of them when it is saved.
 */
export function BulkRow(props: Props) {
  const getPathOf = (key: Key): Path => [...props.path, key];
  const getTypeOf = (key: Key): ValueType =>
    getJsonType(getPathValue(getLatestState(), getPathOf(key)));

  // Read in many places, and each needs a pass over the selection: worked out once per change
  const getKind = createMemo((): BulkKind => getBulkKind(props.selectedKeys.map(getTypeOf)));

  // What can be written, locked or deleted: locked values are skipped, a lock of a parent holds, and
  // the items of a set have no name to write to. Keys, so that an unchanged list is the same list
  const isInSet = (path: Path) => isInsideSet(getLatestState(), path);
  const getStatus = (path: Path) => getLockStatus(path, getLockedPaths());
  const getEditableKeys = createMemo(
    () =>
      props.selectedKeys.filter((key) => {
        const path = getPathOf(key);
        return getStatus(path) === 'unlocked' && !isInSet(path);
      }),
    { equals: sameItems },
  );
  const getLockableKeys = createMemo(
    () =>
      props.selectedKeys.filter((key) => {
        const path = getPathOf(key);
        return getStatus(path) !== 'ancestor-lock' && !isInSet(path);
      }),
    { equals: sameItems },
  );
  // A value that is locked cannot be set, and skipping it quietly would hide that: the input says so
  const getLockedCount = createMemo(
    () => props.selectedKeys.filter((key) => getStatus(getPathOf(key)) !== 'unlocked').length,
  );
  const isSaveShown = () => isEdited() && getLockedCount() === 0;
  const getLockState = createMemo(() =>
    getBulkLockState(getLockableKeys().map((key) => getStatus(getPathOf(key)))),
  );

  const getFirstValue = (): JSONSafeValue | undefined => {
    const key = props.selectedKeys[0];
    return key === undefined ? undefined : getPathValue(getLatestState(), getPathOf(key));
  };
  // Another selection, or another first value, starts over
  const [getDraft, setDraft] = createSignal<JSONSafeValue | undefined>(() => getFirstValue());
  const getSelectionId = () => JSON.stringify([props.selectedKeys, getFirstValue() ?? null]);
  const [getEditedFor, setEditedFor] = createSignal<string>();
  const isEdited = () => getEditedFor() === getSelectionId();
  const edit = (value: JSONSafeValue) => {
    setDraft(() => value);
    setEditedFor(getSelectionId());
  };
  const revert = () => {
    setDraft(() => getFirstValue());
    setEditedFor(undefined);
  };

  const save = async () => {
    const value = getDraft();
    if (value === undefined) return;
    await setStateMulti(getEditableKeys().map((key) => ({ path: getPathOf(key), value })));
  };
  const toggleLock = () =>
    setPathLocks(getLockableKeys().map(getPathOf), getLockState() !== 'locked');
  const remove = async () => {
    const paths = sortForDeletion(getEditableKeys().map(getPathOf));
    if (!paths.length || !(await confirmDeleteMany(paths.length))) return;
    await setStateMulti(paths.map((path): Write => ({ path, delete: true })));
  };

  // Enter: save what is changed, or else lock and unlock them all. Esc: back to the first value
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      revert();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (isEdited()) void save();
      else void toggleLock();
    }
  };

  const choose = (choice: string) => {
    if (choice === 'all') props.onSelect([...props.keys]);
    else if (choice === 'none') props.onSelect([]);
    else props.onSelect(getKeysOfType(props.keys, getTypeOf, choice as ValueType));
  };
  const toggleAll = () => props.onSelect(isAllSelected() ? [] : [...props.keys]);
  const isAllSelected = () =>
    props.keys.length > 0 && props.selectedKeys.length === props.keys.length;
  const isSomeSelected = () => props.selectedKeys.length > 0 && !isAllSelected();
  let checkbox!: HTMLInputElement;
  createEffect(isSomeSelected, (isSome) => {
    checkbox.indeterminate = isSome;
  });

  const lockTitle = () => {
    const state = getLockState();
    if (state === 'locked') return 'Unlock the selected values';
    if (state === 'some-locked') return 'Lock All (Some values are already locked)';
    return 'Lock the selected values';
  };

  // Read only, but not faded: it says why there is no value
  const messageClass = 'min-w-0 flex-1 rounded-md italic text-red-400 [&[readonly]]:opacity-100';

  return (
    <li
      aria-label="Edit the selected values"
      class={[rowColumnsClass, 'items-start border-b border-gray-600 py-1.5']}
    >
      <div class="mr-1 flex h-7.5 min-w-0 items-center gap-2 border border-transparent ps-2 pe-1">
        <input
          ref={checkbox}
          type="checkbox"
          aria-label="Select all"
          class="h-4 w-4 check-box shrink-0"
          checked={isAllSelected()}
          disabled={props.keys.length === 0}
          onChange={toggleAll}
        />
        <select
          aria-label="Select properties"
          class="h-7.5 min-w-0 flex-1 cursor-pointer rounded-md border border-gray-600 bg-gray-700 px-1 text-xs text-gray-100"
          onChange={(event) => {
            choose(event.currentTarget.value);
            event.currentTarget.value = '';
          }}
        >
          <option value="" hidden>
            {props.selectedKeys.length ? `${props.selectedKeys.length} selected` : 'Select…'}
          </option>
          <option value="all">All</option>
          <option value="number">Numbers</option>
          <option value="string">Strings</option>
          <option value="boolean">Booleans</option>
          <option value="none">None</option>
        </select>
      </div>
      <div class="min-w-0">
        <div class="flex items-start gap-1">
          <Switch>
            <Match when={getLockedCount() > 0}>
              <input
                readonly
                aria-label="Value for the selected"
                value={`${getLockedCount()} locked`}
                class={[baseInputClasses, messageClass]}
              />
            </Match>
            <Match when={getKind() === 'number'}>
              <NumberInput
                fill
                value={getDraft() as number}
                onChange={edit}
                onKeyDown={onKeyDown}
                inputProps={{ 'aria-label': 'Value for the selected' }}
              />
            </Match>
            <Match when={getKind() === 'string'}>
              <StringInput
                value={getDraft() as string}
                onChange={edit}
                onKeyDown={onKeyDown}
                class="min-w-0 flex-1"
                inputProps={{
                  'aria-label': 'Value for the selected',
                  'spellcheck': false,
                  'autocomplete': 'off',
                }}
              />
            </Match>
            <Match when={getKind() === 'boolean'}>
              <BooleanInput
                fill
                label="Value for the selected"
                value={getDraft() as boolean}
                onChange={edit}
              />
            </Match>
            <Match when={getKind() === 'mixed'}>
              <input
                readonly
                aria-label="Value for the selected"
                value="Mixed values"
                class={[baseInputClasses, messageClass]}
              />
            </Match>
            <Match when={getKind() === 'none' || getKind() === 'other'}>
              <input
                disabled
                aria-label="Value for the selected"
                placeholder={
                  getKind() === 'none'
                    ? 'Select rows to edit them together'
                    : 'Not editable together'
                }
                class={[baseInputClasses, 'min-w-0 flex-1 rounded-md']}
              />
            </Match>
          </Switch>
          <Switch>
            <Match when={isSaveShown()}>
              <SaveButton onClick={() => void save()} />
            </Match>
            <Match when={!isSaveShown()}>
              <button
                type="button"
                aria-label="Lock the selected"
                aria-pressed={getLockState() === 'locked' ? 'true' : 'false'}
                title={lockTitle()}
                disabled={getLockableKeys().length === 0}
                class={[
                  'relative inline-flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border disabled:cursor-default disabled:opacity-35',
                  getLockState() === 'locked'
                    ? 'border-sky-500 bg-sky-950 text-sky-300'
                    : 'border-gray-500 text-gray-300 enabled:hover:bg-gray-700',
                ]}
                onClick={() => void toggleLock()}
              >
                <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
                  {getLockState() === 'locked' ? 'lock' : 'lock_open'}
                </span>
                <Show when={getLockState() === 'some-locked'}>
                  <span aria-hidden="true" class="absolute top-0 right-1 text-xs leading-none">
                    *
                  </span>
                </Show>
              </button>
            </Match>
          </Switch>
        </div>
      </div>
      <div class="pl-1">
        <DeleteButton disabled={getEditableKeys().length === 0} onDelete={() => void remove()} />
      </div>
    </li>
  );
}
