import clsx from 'clsx';
import type { JSX } from 'solid-js';

import { btnClass } from '../util/btnClass';
import { baseInputClasses } from '../util/common-classes';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const onKeyDown = (e: KeyboardEvent) => props.onKeyDown?.(e);
  const safeOnChange = (newValue: number) => {
    if (!isNaN(newValue)) props.onChange(newValue);
  };

  return (
    <div class={clsx('flex', props.className)}>
      <button
        type="button"
        onClick={() => props.onChange(props.value - 1)}
        disabled={isDisabled()}
        class={clsx(
          btnClass(
            'contained',
            '[REMOVE]: rounded-md px-4',
            'clr-gray hover:clr-sky w-7 rounded-l-md px-2 font-mono',
          ),
        )}
      >
        -
      </button>
      <input
        type="number"
        value={props.value}
        onInput={(e) => safeOnChange(e.target.valueAsNumber)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readOnly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'w-32 rounded-none',
        )}
        {...props.inputProps}
      />
      <button
        type="button"
        onClick={() => props.onChange(props.value + 1)}
        disabled={isDisabled()}
        class={clsx(
          btnClass(
            'contained',
            '[REMOVE]: rounded-md px-4',
            'clr-gray hover:clr-sky w-7 rounded-r-md px-2 font-mono',
          ),
        )}
      >
        +
      </button>
    </div>
  );
}
