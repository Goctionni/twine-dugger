import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';

import { setState, setStatePropertyLock } from '@/devtools-panel/api/api';
import {
  addLockPath,
  clearWatchlistPaths,
  getDiffFrames,
  getLockedPaths,
  getStateFrames,
  getWatchlistPaths,
  removeLockPath,
  removeWatchlistPath,
  setNavigationPage,
  setViewState,
} from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { MutationBadge } from '@/devtools-panel/views/DiffLog/MutationBadge';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getLockStatus } from '@/devtools-panel/views/State/lock-helper';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { pathEquals } from '@/shared/path-equals';
import { Path } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { BooleanInput } from '../../ui/inputs/BooleanInput';

export function WatchlistView() {
  const watchlistPaths = createMemo(() => getWatchlistPaths());

  return (
    <div class="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-200">Watchlist</h2>
        <button
          type="button"
          class="px-2 py-1 rounded text-xs bg-red-700/70 hover:bg-red-600 disabled:opacity-40 disabled:cursor-default"
          onClick={clearWatchlistPaths}
          disabled={!watchlistPaths().length}
        >
          Clear all
        </button>
      </div>

      <Show
        when={watchlistPaths().length}
        fallback={
          <div class="flex-1 grid place-items-center text-gray-400 border border-dashed border-gray-700 rounded-md">
            Right click a diff path and choose Add to watchlist.
          </div>
        }
      >
        <ul class="grid gap-1 overflow-auto pr-1">
          <For each={watchlistPaths()}>
            {(path) => (
              <li>
                <WatchlistRow path={path} />
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}

function WatchlistRow(props: { path: Path }) {
  const currentValue = createMemo(() => {
    const latest = getStateFrames()[0]?.state;
    if (!latest) return undefined;
    return getObjectPathValue(latest, props.path);
  });

  const previousValue = createMemo(() => {
    const previous = getStateFrames()[1]?.state;
    if (!previous) return undefined;
    return getObjectPathValue(previous, props.path);
  });

  const type = createMemo(() => getSpecificType(currentValue()));

  const mutationKind = createMemo<'add' | 'del' | 'chg' | 'typ' | 'mov'>(() => {
    const latestFrame = getDiffFrames()[0];
    const path = props.path;

    const change = latestFrame?.changes.find((diff) => {
      if (diff.type === 'object' || diff.type === 'map') {
        return pathEquals([...diff.path, diff.key], path);
      }
      return pathEquals(diff.path, path);
    });

    if (change) {
      if (change.type === 'type-changed') return 'typ';
      if (change.type === 'string' || change.type === 'number' || change.type === 'boolean')
        return 'chg';
      if (change.type === 'array' && change.subtype === 'instructions') return 'mov';
      if (
        (change.type === 'array' ||
          change.type === 'set' ||
          change.type === 'object' ||
          change.type === 'map') &&
        change.subtype === 'add'
      )
        return 'add';
      if (
        (change.type === 'array' ||
          change.type === 'set' ||
          change.type === 'object' ||
          change.type === 'map') &&
        change.subtype === 'remove'
      )
        return 'del';
    }

    const prevType = getSpecificType(previousValue());
    const curType = getSpecificType(currentValue());
    if (prevType !== curType) return 'typ';
    if (prevType === 'undefined' && curType !== 'undefined') return 'add';
    if (prevType !== 'undefined' && curType === 'undefined') return 'del';
    return 'chg';
  });

  const openInState = () => {
    setViewState('state', 'historyId', -1);
    setViewState('state', 'path', props.path);
    setNavigationPage('state');
  };

  return (
    <div class="border border-gray-700 bg-gray-800/70 rounded px-2 py-1 overflow-x-auto">
      <div class="grid min-w-[620px] grid-cols-[minmax(275px,33%)_minmax(0,1fr)_275px] items-center gap-2">
        <div class="min-w-0 flex items-center gap-1.5">
          <MutationBadge kind={mutationKind()} />
          <span class="text-sm font-semibold truncate">
            <PrettyPath path={props.path} statePrefix />
          </span>
        </div>

        <div class="min-w-0 w-full justify-self-start text-left text-xs text-gray-300 inline-flex items-center gap-1 overflow-hidden whitespace-nowrap">
          <span class="min-w-0 max-w-[48%] overflow-hidden text-ellipsis whitespace-nowrap">
            <RenderValue value={previousValue()} faded />
          </span>
          <span class="text-gray-500">-&gt;</span>
          <span class="min-w-0 max-w-[48%] overflow-hidden text-ellipsis whitespace-nowrap">
            <RenderValue value={currentValue()} />
          </span>
        </div>

        <div class="w-full justify-self-end flex items-center justify-end gap-1 min-w-0 overflow-x-auto whitespace-nowrap">
          <WatchlistPrimitiveInput path={props.path} type={type()} />
          <WatchlistLockButton path={props.path} />
          <IconActionButton
            label="Open in state"
            icon="open_in_new"
            onClick={openInState}
            hoverClass="hover:text-emerald-300 hover:border-emerald-500/70"
          />
          <IconActionButton
            label="Remove from watchlist"
            icon="close"
            onClick={() => removeWatchlistPath(props.path)}
            hoverClass="hover:text-red-300 hover:border-red-500/70"
          />
        </div>
      </div>
    </div>
  );
}

function WatchlistPrimitiveInput(props: { path: Path; type: string }) {
  const currentValue = createMemo(() => {
    const latest = getStateFrames()[0]?.state;
    if (!latest) return undefined;
    return getObjectPathValue(latest, props.path);
  });

  const getPath = () => props.path;
  const isDisabled = () => getLockStatus(getPath, getLockedPaths) !== 'unlocked';

  const [stringValue, setStringValue] = createSignal('');
  const [numberValue, setNumberValue] = createSignal(0);

  createEffect(() => {
    if (props.type === 'string') {
      setStringValue(typeof currentValue() === 'string' ? (currentValue() as string) : '');
    }
    if (props.type === 'number') {
      setNumberValue(typeof currentValue() === 'number' ? (currentValue() as number) : 0);
    }
  });

  const saveString = async () => {
    await setState(props.path, stringValue());
  };

  const saveNumber = async () => {
    await setState(props.path, numberValue());
  };

  const hasStringChanges = () => stringValue() !== currentValue();
  const hasNumberChanges = () => numberValue() !== currentValue();

  const onStringKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled()) saveString();
    if (e.key === 'Escape')
      setStringValue(typeof currentValue() === 'string' ? (currentValue() as string) : '');
  };

  const onNumberKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled()) saveNumber();
    if (e.key === 'Escape')
      setNumberValue(typeof currentValue() === 'number' ? (currentValue() as number) : 0);
  };

  const setBoolean = async (value: boolean) => {
    if (isDisabled()) return;
    await setState(props.path, value);
  };

  return (
    <div class="flex items-center gap-1">
      <Switch>
        <Match when={props.type === 'string'}>
          <StringInput
            value={stringValue()}
            onChange={setStringValue}
            onKeyDown={onStringKeyDown}
            disabled={isDisabled()}
            class="w-[180px]"
          />
          <Show when={hasStringChanges() && !isDisabled()}>
            <SaveButton onClick={saveString} />
          </Show>
        </Match>

        <Match when={props.type === 'number'}>
          <NumberInput
            value={numberValue()}
            onChange={setNumberValue}
            onKeyDown={onNumberKeyDown}
            disabled={isDisabled()}
          />
          <Show when={hasNumberChanges() && !isDisabled()}>
            <SaveButton onClick={saveNumber} />
          </Show>
        </Match>

        <Match when={props.type === 'boolean'}>
          <BooleanInput
            value={typeof currentValue() === 'boolean' ? (currentValue() as boolean) : false}
            onChange={setBoolean}
            disabled={isDisabled()}
          />
        </Match>
        <Match
          when={props.type !== 'string' && props.type !== 'number' && props.type !== 'boolean'}
        >
          <span class="text-xs text-gray-400 px-2">Readonly</span>
        </Match>
      </Switch>
    </div>
  );
}

function WatchlistLockButton(props: { path: Path }) {
  const getPath = () => props.path;
  const lockStatus = () => getLockStatus(getPath, getLockedPaths);

  const toggleLock = () => {
    if (lockStatus() === 'locked') {
      removeLockPath(props.path);
      setStatePropertyLock(props.path, false);
      return;
    }
    if (lockStatus() === 'unlocked') {
      addLockPath(props.path);
      setStatePropertyLock(props.path, true);
    }
  };

  return (
    <IconActionButton
      label={
        lockStatus() === 'locked'
          ? 'Unlock value'
          : lockStatus() === 'unlocked'
            ? 'Lock value'
            : 'Ancestor locked'
      }
      icon={lockStatus() === 'locked' ? 'lock' : 'lock_open'}
      onClick={toggleLock}
      hoverClass={
        lockStatus() === 'locked'
          ? 'hover:text-red-300 hover:border-red-500/70 hover:bg-red-900/20'
          : 'hover:text-amber-300 hover:border-amber-500/70'
      }
      activeClass={
        lockStatus() === 'locked' ? 'text-amber-300 border-amber-500/60 bg-amber-900/20' : ''
      }
      disabled={lockStatus() === 'ancestor-lock'}
    />
  );
}

interface IconActionButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  hoverClass: string;
  activeClass?: string;
  disabled?: boolean;
}

function IconActionButton(props: IconActionButtonProps) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      onClick={() => props.onClick()}
      disabled={props.disabled}
      class={`
        inline-flex size-7 items-center justify-center rounded-md border border-gray-600
        text-gray-300 bg-gray-800/70 transition-colors
        disabled:opacity-40 disabled:cursor-default
        ${props.hoverClass}
        ${props.activeClass ?? ''}
      `}
    >
      <span class="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
        {props.icon}
      </span>
    </button>
  );
}
