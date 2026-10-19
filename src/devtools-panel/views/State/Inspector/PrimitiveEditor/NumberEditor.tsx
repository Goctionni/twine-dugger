import { Match, Switch } from 'solid-js';

import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import type { Path } from '@/shared/shared-types';

import { createDraft } from '../createDraft';
import { createEditStatus } from '../createEditStatus';
import { createStablePath } from '../createStablePath';

interface Props {
  path: Path;
  /** Names the value for those who cannot see it */
  label: string;
}

export function NumberEditor(props: Props) {
  const getPath = createStablePath(() => props.path);
  const { getDraft, setDraft, isDirty, revert, save } = createDraft<number>(getPath);
  const { getStatus, isDisabled, toggleLock } = createEditStatus(getPath);

  // Enter in the field: save, or lock and unlock when there is nothing to save
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      revert();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // An empty or half typed field is not a number: it is not for the lock either
      if (Number.isNaN((event.currentTarget as HTMLInputElement).valueAsNumber)) return;
      if (isDirty()) void save();
      else if (getStatus() !== 'ancestor-lock') void toggleLock();
    }
  };

  return (
    <div class="group relative flex flex-col gap-2">
      <div class="flex items-start gap-2">
        <NumberInput
          value={getDraft()}
          fill
          onChange={(value) => setDraft(value)}
          onKeyDown={onKeyDown}
          disabled={isDisabled()}
          readOnly={getStatus() === 'locked'}
          inputProps={{ 'aria-label': props.label }}
        />
        <Switch>
          <Match when={isDirty()}>
            <SaveButton onClick={() => void save()} />
          </Match>
          <Match when={!isDirty()}>
            <LockButton status={getStatus()} onToggle={() => void toggleLock()} />
          </Match>
        </Switch>
      </div>
      {/* Under the field while it has the focus: it takes no room, so nothing moves */}
      <p class="pointer-events-none absolute top-full left-0 z-10 mt-1 hidden text-xs text-gray-400 group-focus-within:block">
        {getStatus() === 'locked'
          ? 'Enter unlocks'
          : 'Enter saves, or locks / unlocks · Esc reverts · ↑ ↓ ±1 · Shift+↑ ↓ ±10 · Ctrl+↑ ↓ ×10 ÷10'}
      </p>
    </div>
  );
}
