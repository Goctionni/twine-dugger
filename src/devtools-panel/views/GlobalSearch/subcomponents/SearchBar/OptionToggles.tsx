import clsx from 'clsx';
import type { ParentProps } from 'solid-js';

interface OptionToggleProps {
  active: boolean;
  onToggle: () => void;
}

function ToggleOptionButton(props: ParentProps<OptionToggleProps & { title: string }>) {
  return (
    <button
      type="button"
      class={clsx(
        'cursor-pointer rounded-sm px-1.5 py-0.5 font-mono text-xs',
        props.active ? 'bg-sky-700 text-white' : 'text-slate-300 hover:bg-slate-700',
      )}
      title={props.title}
      aria-pressed={props.active ? 'true' : 'false'}
      onClick={() => props.onToggle()}
    >
      {props.children}
    </button>
  );
}

export function ToggleCaseSensitive(props: OptionToggleProps) {
  return (
    <ToggleOptionButton title="Match case" active={props.active} onToggle={props.onToggle}>
      Aa
    </ToggleOptionButton>
  );
}

/** "ab" with a bracket under it, as the whole word button looks in VS Code */
export function ToggleWholeWord(props: OptionToggleProps) {
  return (
    <ToggleOptionButton title="Match whole word" active={props.active} onToggle={props.onToggle}>
      <span class="relative inline-block px-px">
        ab
        <span class="absolute -inset-x-px bottom-px h-0.75 border-x border-b border-current" />
      </span>
    </ToggleOptionButton>
  );
}

export function ToggleRegex(props: OptionToggleProps) {
  return (
    <ToggleOptionButton title="Regular expression" active={props.active} onToggle={props.onToggle}>
      .*
    </ToggleOptionButton>
  );
}
