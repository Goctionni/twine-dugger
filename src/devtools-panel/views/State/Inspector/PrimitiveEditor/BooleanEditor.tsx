import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import type { Path } from '@/shared/shared-types';

import { createEditableValue } from '../createEditableValue';
import { createEditStatus } from '../createEditStatus';

interface Props {
  path: Path;
  label: string;
  compact?: boolean;
}

export function BooleanEditor(props: Props) {
  const [getValue, setValue, isWaiting] = createEditableValue<boolean>(() => props.path);

  const { getStatus, isDisabled, toggleLock } = createEditStatus(() => props.path);

  return (
    <div
      class="flex items-center gap-1"
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        if (getStatus() !== 'ancestor-lock') void toggleLock();
      }}
    >
      <BooleanInput
        label={props.label}
        fill
        class={getStatus() === 'locked' ? 'opacity-60' : undefined}
        value={getValue()}
        onChange={(value) => void setValue(value)}
        readOnly={getStatus() === 'locked' || isWaiting()}
        disabled={isDisabled()}
      />
      <LockButton
        status={getStatus()}
        onToggle={() => void toggleLock()}
        tabindex={props.compact ? -1 : undefined}
      />
    </div>
  );
}
