import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import type { Path } from '@/shared/shared-types';

import { createEditableValue } from '../createEditableValue';
import { getLockStatus, isInsideSet } from '../logic/edit-status';

interface Props {
  path: Path;
  label: string;
}

export function BooleanEditor(props: Props) {
  const [getValue, setValue, isWaiting] = createEditableValue<boolean>(() => props.path);

  const getStatus = () => getLockStatus(props.path, getLockedPaths());
  const toggleLock = () => setPathLock(props.path, getStatus() === 'unlocked');

  return (
    <div
      class="flex items-center gap-2"
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        if (getStatus() !== 'ancestor-lock') void toggleLock();
      }}
    >
      <BooleanInput
        label={props.label}
        value={getValue()}
        onChange={(value) => void setValue(value)}
        readOnly={getStatus() === 'locked' || isWaiting()}
        disabled={getStatus() === 'ancestor-lock' || isInsideSet(getLatestState(), props.path)}
      />
      <LockButton status={getStatus()} onToggle={() => void toggleLock()} />
    </div>
  );
}
