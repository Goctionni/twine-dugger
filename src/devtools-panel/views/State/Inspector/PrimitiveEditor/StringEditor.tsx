import clsx from 'clsx';
import { Match, Show, Switch, createSignal, untrack } from 'solid-js';

import { KeyHint } from '@/devtools-panel/ui/display/KeyHint';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import type { Path } from '@/shared/shared-types';

import { createDraft } from '../createDraft';
import { createEditStatus } from '../createEditStatus';
import { createStablePath } from '../createStablePath';

interface Props {
  path: Path;
  /** Names the value for those who cannot see it */
  label: string;
  /** For a row of a container: no choice of a larger field, and no hint, which would not fit */
  compact?: boolean;
}

export function StringEditor(props: Props) {
  const getPath = createStablePath(() => props.path);
  const { getStateValue, getDraft, setDraft, isDirty, revert, save } = createDraft<string>(getPath);
  const { getStatus, isDisabled, toggleLock } = createEditStatus(getPath);

  // Starts from the text that is saved, for every value
  const [isMultilineChoice, setMultilineChoice] = createSignal(() => {
    getPath();
    return untrack(getStateValue).includes('\n');
  });

  // A single line cannot hold a line break: text that has one is always shown in the larger field
  const hasNewline = () => getDraft().includes('\n');
  const isMultiline = () => (!props.compact && isMultilineChoice()) || hasNewline();

  // Enter in the field: save, or lock and unlock when there is nothing to save. In the larger
  // field Enter is a new line, and Ctrl+Enter does this
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      revert();
    } else if (event.key === 'Enter' && (!isMultiline() || event.ctrlKey)) {
      event.preventDefault();
      if (isDirty()) void save();
      else if (getStatus() !== 'ancestor-lock') void toggleLock();
    }
  };

  const getHelp = () => {
    const enter = isMultiline() ? 'Ctrl+Enter' : 'Enter';
    return getStatus() === 'locked'
      ? `${enter} unlocks`
      : `${enter} saves, or locks / unlocks · Esc reverts`;
  };

  return (
    <div class="group relative flex flex-col gap-2">
      <div class="flex items-start gap-1">
        <Switch>
          <Match when={!isMultiline()}>
            <StringInput
              value={getDraft()}
              onChange={(text) => setDraft(text)}
              onKeyDown={onKeyDown}
              disabled={isDisabled()}
              readOnly={getStatus() === 'locked'}
              class="min-w-0 flex-1"
              inputProps={{ 'aria-label': props.label, 'spellcheck': false, 'autocomplete': 'off' }}
            />
          </Match>
          <Match when={isMultiline()}>
            <textarea
              aria-label={props.label}
              rows={props.compact ? 2 : 5}
              spellcheck="false"
              value={getDraft()}
              disabled={isDisabled()}
              readonly={getStatus() === 'locked'}
              onInput={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={onKeyDown}
              class={clsx(baseInputClasses, 'min-w-0 flex-1 resize-y rounded-md font-mono')}
            />
          </Match>
        </Switch>
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
        <label class="flex w-fit items-center gap-2 text-sm text-gray-300 select-none">
          <input
            type="checkbox"
            class="h-4 w-4 check-box"
            checked={isMultiline()}
            disabled={hasNewline()}
            onChange={(event) => setMultilineChoice(event.currentTarget.checked)}
          />
          Multiline
        </label>
        <KeyHint>{getHelp()}</KeyHint>
      </Show>
    </div>
  );
}
