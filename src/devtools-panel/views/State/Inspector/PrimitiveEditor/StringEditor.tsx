import clsx from 'clsx';
import { Match, Switch, createSignal, untrack } from 'solid-js';

import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, setPathLock } from '@/devtools-panel/store/locks';
import { LockButton } from '@/devtools-panel/ui/inputs/LockButton';
import { SaveButton } from '@/devtools-panel/ui/inputs/SaveButton';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { createStablePath } from '../createStablePath';
import { getLockStatus, isInsideSet } from '../logic/edit-status';

interface Props {
  path: Path;
  /** Names the value for those who cannot see it */
  label: string;
}

export function StringEditor(props: Props) {
  const getPath = createStablePath(() => props.path);
  const getStateValue = () => getPathValue(getLatestState(), getPath()) as string;

  // The draft starts as the saved text, and belongs to the value it was typed against: it starts
  // over for another path, and for another value at the path (the game changed it, or the save of the
  // draft arrived). A save that does not get through changes nothing, so the draft stays to try again
  const [getDraft, setDraft] = createSignal(() => getStateValue());
  // Starts from the text that is saved, for every value
  const [isMultilineChoice, setMultilineChoice] = createSignal(() => {
    getPath();
    return untrack(getStateValue).includes('\n');
  });

  // A single line cannot hold a line break: text that has one is always shown in the larger field
  const hasNewline = () => getDraft().includes('\n');
  const isMultiline = () => isMultilineChoice() || hasNewline();
  const isDirty = () => getDraft() !== getStateValue();

  const getStatus = () => getLockStatus(getPath(), getLockedPaths());
  const isDisabled = () =>
    getStatus() === 'ancestor-lock' || isInsideSet(getLatestState(), getPath());
  const toggleLock = () => setPathLock(getPath(), getStatus() === 'unlocked');

  const save = async () => {
    const text = getDraft();
    if (!isDirty()) return;
    try {
      await setState(getPath(), text);
    } catch (error) {
      console.error('Failed to save the value:', error);
    }
  };

  // Enter in the field: save, or lock and unlock when there is nothing to save. In the larger
  // field Enter is a new line, and Ctrl+Enter does this
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setDraft(getStateValue());
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
      <div class="flex items-start gap-2">
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
              rows="5"
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
      {/* Under the field while it has the focus: it takes no room, so nothing moves */}
      <p class="pointer-events-none absolute top-full left-0 z-10 mt-1 hidden text-xs text-gray-400 group-focus-within:block">
        {getHelp()}
      </p>
    </div>
  );
}
