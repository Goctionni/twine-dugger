import clsx from 'clsx';
import { JSX } from 'solid-js';

import { btnClass } from '../util/btnClass';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

const baseInputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const onKeyDown = (e: KeyboardEvent) => props.onKeyDown?.(e);

  return (
    <div class={clsx('flex', props.className)}>
      <button
        type="button"
        onClick={() => props.onChange(props.value - 1)}
        disabled={isDisabled()}
        class={clsx(
          btnClass(
            'contained',
            '- px-4 rounded-md',
            'clr-gray font-mono px-2 w-7 rounded-l-md hover:clr-sky',
          ),
        )}
      >
        -
      </button>
      <input
        type="number"
        value={props.value}
        onInput={(e) => props.onChange(e.target.valueAsNumber)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readOnly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
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
            '- px-4 rounded-md',
            'clr-gray font-mono px-2 w-7 rounded-r-md hover:clr-sky',
          ),
        )}
      >
        +
      </button>
    </div>
  );
}
