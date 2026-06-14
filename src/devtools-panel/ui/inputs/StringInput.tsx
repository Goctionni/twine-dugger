import clsx from 'clsx';
import type { JSX } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

import { baseInputClasses } from '../util/common-classes';

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
