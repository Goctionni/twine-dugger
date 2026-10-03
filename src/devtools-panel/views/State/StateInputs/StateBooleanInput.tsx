import { Show } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getActiveState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import { createGetViewState } from '@/devtools-panel/store/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { isPathEditable } from '../editable';
import { getLockStatus } from '../lock-helper';

interface StateBooleanInputProps {
  path: Path;
}

export function StateBooleanInput(props: StateBooleanInputProps) {
  const getHistoryRef = createGetViewState('state', 'historyRef');

  const currentValue = () => {
    const activeState = getActiveState();
    if (!activeState) return false;
    const pathValue = getPathValue(activeState, props.path);
    return typeof pathValue === 'boolean' ? pathValue : false;
  };

  const getPath = () => props.path;
  const isReadOnly = () => getHistoryRef() !== 'latest';
  const lockStatus = () => getLockStatus(getPath, getLockedPaths);
  const isDisabled = () =>
    lockStatus() !== 'unlocked' || isReadOnly() || !isPathEditable(props.path);
  const getId = () =>
    getPath()
      .join('_')
      .replaceAll(/[^a-zA-z0-9]/g, '_')
      .replaceAll(/_{2,}/g, '_');

  const handleChange = async (newValue: boolean) => {
    const disabled = isDisabled();
    if (disabled) return;

    try {
      await setState(props.path, newValue);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  const handleToggleLock = () => {
    if (lockStatus() === 'locked') setPathLock(props.path, false);
    else if (lockStatus() === 'unlocked') setPathLock(props.path, true);
  };

  return (
    <div class="flex justify-start gap-2 select-none">
      <BooleanInput
        value={currentValue()}
        onChange={handleChange}
        disabled={isDisabled()}
        id={getId()}
      />

      <Show when={!isReadOnly()}>
        <LockButton status={lockStatus()} onToggle={handleToggleLock} />
      </Show>
    </div>
  );
}
