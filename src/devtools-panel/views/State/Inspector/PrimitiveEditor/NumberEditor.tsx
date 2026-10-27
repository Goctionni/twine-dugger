import { Match, Show, Switch, createMemo } from 'solid-js';

import { getLockRange, setLockRange } from '@/devtools-panel/store/locks';
import { KeyHint } from '@/devtools-panel/ui/display/KeyHint';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import type { Path } from '@/shared/shared-types';

import { createDraft } from '../createDraft';
import { createEditStatus } from '../createEditStatus';
import type { LockRange } from '../logic/lock-range';
import { changeBound } from '../logic/lock-range';
import { RangeBound } from './RangeBound';

interface Props {
  path: Path;
  label: string;
  compact?: boolean;
}

export function NumberEditor(props: Props) {
  const getPath = createStablePath(() => props.path);
  const { getStatus, isDisabled, toggleLock } = createEditStatus(getPath);
  // A locked number has a range, which is the number itself until a bound is changed
  const getRange = () => (getStatus() === 'locked' ? getLockRange(getPath()) : undefined);
  // The inputs for the bounds are made once, for as long as it is locked
  const hasRange = createMemo(() => !props.compact && getRange() !== undefined);
  const isExactLock = () => {
    const range = getRange();
    return range !== undefined && range.min === range.max;
  };
  const { getDraft, getDraftText, setDraft, isDirty, revert, save } = createDraft<number>(
    getPath,
    (value) => Math.min(Math.max(value, getRange()?.min ?? -Infinity), getRange()?.max ?? Infinity),
  );
  const isTextChangedBySave = () => {
    const text = getDraftText();
    return text !== undefined && text !== String(getDraft());
  };
  const changeRange = (bound: keyof LockRange, value: number) => {
    const range = getRange();
    if (!range) return;
    const { min, max } = changeBound(range, bound, value);
    void setLockRange(getPath(), min, max);
  };

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
      <div class="flex items-start gap-1">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <NumberInput
            value={getDraft()}
            valueText={getDraftText()}
            fill
            onChange={setDraft}
            onKeyDown={onKeyDown}
            disabled={isDisabled()}
            readOnly={isExactLock()}
            min={getRange()?.min}
            max={getRange()?.max}
            before={
              hasRange() ? (
                <RangeBound
                  label={`${props.label}, minimum`}
                  value={getRange()?.min ?? 0}
                  class="rounded-l-md"
                  onCommit={(value) => changeRange('min', value)}
                />
              ) : undefined
            }
            after={
              hasRange() ? (
                <RangeBound
                  label={`${props.label}, maximum`}
                  value={getRange()?.max ?? 0}
                  class="rounded-r-md"
                  onCommit={(value) => changeRange('max', value)}
                />
              ) : undefined
            }
            inputProps={{ 'aria-label': props.label }}
          />
          <Show when={!props.compact && isTextChangedBySave()}>
            <p role="status" class="text-center text-xs text-amber-400">
              Will be saved as {getDraft()}
            </p>
          </Show>
          <Show when={hasRange()}>
            <div aria-hidden="true" class="flex text-[10px] leading-none text-gray-400">
              <span class="w-16 text-center">min</span>
              <span class="flex-1" />
              <span class="w-16 text-center">max</span>
            </div>
          </Show>
        </div>
        <Switch>
          <Match when={isDirty()}>
            <SaveButton onClick={() => void save()} />
          </Match>
          <Match when={!isDirty()}>
            <LockButton status={getStatus()} onToggle={() => void toggleLock()} />
          </Match>
        </Switch>
      </div>
      <Show when={!props.compact}>
        <KeyHint>
          {getStatus() === 'locked'
            ? 'Enter unlocks'
            : 'Enter saves, or locks / unlocks · Esc reverts · ↑ ↓ ±1 · Shift+↑ ↓ ±10 · Ctrl+↑ ↓ ×10 ÷10'}
        </KeyHint>
      </Show>
    </div>
  );
}
