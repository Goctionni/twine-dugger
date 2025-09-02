import clsx from 'clsx';
import { createEffect, createSignal, JSX } from 'solid-js';

interface StringInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  class?: string;
  autoFocus?: boolean;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

const baseInputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

export function StringInput(props: StringInputProps) {
  const onKeyDown = (e: KeyboardEvent) => props.onKeyDown?.(e);
  const [ref, setRef] = createSignal<HTMLElement | null>(null);

  createEffect(() => {
    if (props.autoFocus && ref()) ref()!.focus();
  });

  return (
    <input
      ref={setRef}
      type="text"
      value={props.value}
      onInput={(e) => props.onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      class={clsx(baseInputClasses, 'rounded-md', props.class)}
      autofocus={props.autoFocus}
      {...props.inputProps}
    />
  );
}
