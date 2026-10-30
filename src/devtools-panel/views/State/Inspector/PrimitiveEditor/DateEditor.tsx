import clsx from 'clsx';
import { Match, Show, Switch } from 'solid-js';

import { KeyHint } from '@/devtools-panel/ui/display/KeyHint';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import type { DateMarker } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { createDraft } from '../createDraft';
import { createEditStatus } from '../createEditStatus';
import { parseDateText, stepDateText, toDateText } from '../logic/date-text';

interface Props {
  path: Path;
  /** Names the value for those who cannot see it */
  label: string;
  /** For a row of a container: no message and no hint, which would not fit. The problem is the title */
  compact?: boolean;
}

/** A Date is typed as `2020-01-02 03:04:05`; up and down change the part at the caret */
export function DateEditor(props: Props) {
  const getPath = createStablePath(() => props.path);
  const { getDraft, setDraft, isDirty, revert, save } = createDraft<string>(getPath, undefined, {
    read: (marker) => toDateText(marker as DateMarker),
    write: (text) => {
      const parsed = parseDateText(text);
      return 'marker' in parsed ? parsed.marker : text;
    },
  });
  const { getStatus, isDisabled, toggleLock } = createEditStatus(getPath);

  const getProblem = () => {
    const parsed = parseDateText(getDraft());
    return 'error' in parsed ? parsed.error : undefined;
  };
  // Only what was typed is judged: a Date that is not a time in the game reads "Invalid Date"
  const getTypedProblem = () => (isDirty() ? getProblem() : undefined);
  const trySave = () => {
    if (isDirty() && getProblem() === undefined) void save();
  };

  // Up and down change the part that the caret is in, and keep it selected for the next key
  const step = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (isDisabled() || getStatus() === 'locked') return;
    const input = event.currentTarget as HTMLInputElement;
    const steps = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1);
    const stepped = stepDateText(getDraft(), input.selectionStart ?? 0, steps);
    if (!stepped) return;
    event.preventDefault();
    // The field has the text before the draft is read again, so the selection can be set now
    input.value = stepped.text;
    input.setSelectionRange(...stepped.selection);
    setDraft(stepped.text);
  };

  // Enter in the field: save, or lock and unlock when there is nothing to save
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      step(event);
    } else if (event.key === 'Escape') {
      revert();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (isDirty()) trySave();
      else if (getStatus() !== 'ancestor-lock') void toggleLock();
    }
  };

  return (
    <div class="group relative flex flex-col gap-2">
      <div class="flex items-start gap-1">
        <StringInput
          value={getDraft()}
          onChange={(text) => setDraft(text)}
          onKeyDown={onKeyDown}
          disabled={isDisabled()}
          readOnly={getStatus() === 'locked'}
          class={clsx('min-w-0 flex-1 font-mono', getTypedProblem() && 'border-red-500!')}
          inputProps={{
            'aria-label': props.label,
            'aria-invalid': getTypedProblem() ? 'true' : undefined,
            'title': props.compact ? getTypedProblem() : undefined,
            'spellcheck': 'false',
            'autocomplete': 'off',
          }}
        />
        <Switch>
          <Match when={isDirty()}>
            <SaveButton
              onClick={trySave}
              disabled={getProblem() !== undefined}
              tabindex={props.compact ? -1 : undefined}
            />
          </Match>
          <Match when={!isDirty()}>
            <LockButton
              status={getStatus()}
              onToggle={() => void toggleLock()}
              tabindex={props.compact ? -1 : undefined}
            />
          </Match>
        </Switch>
      </div>
      <Show when={!props.compact}>
        <Show when={getTypedProblem()}>
          {(problem) => <p class="text-xs text-red-400">{problem()}</p>}
        </Show>
        <KeyHint>
          {getStatus() === 'locked'
            ? 'Enter unlocks'
            : 'Enter saves, or locks / unlocks · Esc reverts · ↑ ↓ change the part at the cursor · Shift+↑ ↓ ±10'}
        </KeyHint>
      </Show>
    </div>
  );
}
